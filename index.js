'use strict'

const path = require('path'),
  Dab = require('@rappopo/dab'),
  async = require('async'),
  docFilter = require('knex-doc-filter')

class DabKnex extends Dab {
  constructor (options) {
    super(options)
  }

  setOptions (options) {
    super.setOptions(this._.merge(this.options, {
      idSrc: 'id',
      idDest: options.idDest || options.idSrc || 'id',
      client: options.client || 'sqlite3',
      connection: options.connection || {
        filename: '/tmp/test.sqlite3'
      },
      table: 'test'
    }))
    if (this.options.client === 'sqlite3')
      this.options.options.useNullAsDefault = true
  }

  sanitize (params, body = {}) {
    body = this._.cloneDeep(body)
    params = typeof params === 'string' ? { table: params } : (params || {})
    return [params, body]
  }

  setClient (params) {
    if (this.client) return
    let opt = this._.merge(this.options.options, {
      client: params.client || this.options.client,
      connection: params.connection || this.options.connection
    })
    this.client = require('knex')(opt)
  }

  buildSort (sort) {
    let result = []
    this._.each(sort, s => {
      this._.forOwn(s, (v, k) => {
        result.push(k + ' ' + v)
      })
    })
    return result.join(', ')
  }

  find (params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    let limit = params.limit || this.options.limit,
      skip = ((params.page || 1) - 1) * limit,
      sort = this.buildSort(params.sort),
      query = params.query || {},
      table = params.table || this.options.table
    return new Promise((resolve, reject) => {
      let total, sel = this.client(table).limit(limit).offset(skip)
      if (!this._.isEmpty(sort)) 
        sel = sel.orderByRaw(sort)
      Promise.all([
        docFilter(this.client(table), query),
        docFilter(sel, query)
      ])
      .then(results => {
        let data = { 
          success: true,
          total: results[0][0],
          data: [] 
        }
        results[1].forEach((d, i) => {
          data.data.push(this.convertDoc(d))
        })
        resolve(data)
      })
      .catch(reject)
    })
  }

  _findOne (id, params, callback) {
    this.client(params.table || this.options.table)
    .where('id', id)
    .then(data => {
      if (data.length === 0) {
        return callback({
          success: false,
          err: new Error('Not found')
        })
      }
      data = {
        success: true,
        data: data[0]
      }
      callback(data)        
    })
    .catch(err => {
      callback({
        success: false,
        err: err
      })          
    })
  }

  findOne (id, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      this._findOne(id, params || {}, result => {
        if (!result.success)
          return reject(result.err)
        let data = {
          success: true,
          data: this.convertDoc(result.data)
        }
        resolve(data)
      })
    })
  }

  _create (body, params, callback) {
    this.client(params.table || this.options.table).insert(body, 'id')
    .then(result => {
      let id = this._.isString(body[this.options.idSrc]) ? body[this.options.idSrc] : result[0]
      this._findOne(id, params, callback)
    })
    .catch(err => {
      callback({
        success: false,
        err: err
      })
    })
  }

  create (body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      let id
      [body, id] = this.delFakeGetReal(body)
      if (id) {
        this._findOne(id, params, result => {
          if (result.success) 
            return reject(new Error('Exists'))
          this._create(body, params, result => {
            if (!result.success)
              return reject(result.err)
            result.data = this.convertDoc(result.data)
            resolve(result)
          })
        })
      } else {
        this._create(body, params, result => {
          if (!result.success)
            return reject(result.err)
          result.data = this.convertDoc(result.data)
          resolve(result)
        })        
      }
    })
  }

  update (id, body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    body = this._.omit(body, [this.options.idDest || this.options.idSrc])
    return new Promise((resolve, reject) => {
      this._findOne(id, params, result => {
        if (!result.success)
          return reject(result.err)
        let source = result.data
        this.client(params.table || this.options.table)
        .where(this.options.idSrc, id)
        .update(body)
        .then(result => {
          this._findOne(id, params, result => {
            if (!result.success)
              return reject(result.err)
            let data = {
              success: true,
              data: this.convertDoc(result.data)
            }
            if (params.withSource)
              data.source = source
            resolve(data)
          })
        })
        .catch(reject)
      })
    })
  }

  remove (id, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      this._findOne(id, params, result => {
        if (!result.success)
          return reject(result.err)
        let source = result.data
        this.client(params.table || this.options.table).where(this.options.idSrc, id).del()
        .then(result => {
          let data = {
            success: true
          }
          if (params.withSource)
            data.source = source
          resolve(data)
        })
        .catch(reject)
      })
    })
  }

  bulkCreate (body, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      const table = params.table || this.options.table
      if (!this._.isArray(body))
        return reject(new Error('Require array'))

      this._.each(body, (b, i) => {
        if (!b[this.options.idSrc])
          b[this.options.idSrc] = this.uuid()
        body[i] = b
      })
      const keys = this._(body).map(this.options.idSrc).value()

      this.client.select('id').from(table)
      .whereIn('id', keys).asCallback((err, docs) => {
        if (err)
          return reject(err)
        let info = this._.map(docs, 'id'),
          newBody = this._.clone(body)
        this._.pullAllWith(newBody, info, (i,x) => {
          return i.id === x
        })
        async.mapSeries(newBody, (b, cb) => {
          this.client(table).insert(this._.omit(b, 'id'), 'id').asCallback((err, result) => {
            cb(null, err ? { id: b.id, message: err.message } : null)
          })
        }, (err, result) => {
          let ok = 0, status = []
          this._.each(body, (r, i) => {
            let stat = { success: info.indexOf(r.id) === -1 ? true : false }
            stat[this.options.idDest] = r.id
            if (!stat.success)
              stat.message = 'Exists'
            else
              ok++
            status.push(stat)
          })
          let data = {
            success: true,
            stat: {
              ok: ok,
              fail: body.length - ok,
              total: body.length
            },
            data: status
          }
          resolve(data)
        })    
      })
    })
  }

  bulkUpdate (body, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      const table = params.table || this.options.table
      if (!this._.isArray(body))
        return reject(new Error('Require array'))

      this._.each(body, (b, i) => {
        if (!b[this.options.idSrc])
          b[this.options.idSrc] = this.uuid()
        body[i] = b
      })
      const keys = this._(body).map(this.options.idSrc).value()

      this.client.select('id').from(table)
      .whereIn('id', keys).asCallback((err, docs) => {
        if (err)
          return reject(err)
        let info = this._.map(docs, 'id'),
          newBody = this._.clone(body)
        this._.pullAllWith(newBody, info, (i,x) => {
          return i.id !== x
        })
        async.mapSeries(newBody, (b, cb) => {
          this.client(table).where('id', b.id).update(this._.omit(b, 'id')).asCallback((err, result) => {
            cb(null, err ? { id: b.id, message: err.message } : null)
          })
        }, (err, result) => {
          let ok = 0, status = []
          this._.each(body, (r, i) => {
            let stat = { success: info.indexOf(r.id) > -1 ? true : false }
            if (stat.success) {
              let rec = this._.find(result, { id: r.id })
              if (rec) {
                stat.success = false
                stat.message = rec.message
              }
            }
            stat[this.options.idDest] = r.id
            if (!stat.success && !stat.message)
              stat.message = 'Not found'
            else
              ok++
            status.push(stat)
          })
          let data = {
            success: true,
            stat: {
              ok: ok,
              fail: body.length - ok,
              total: body.length
            },
            data: status
          }
          resolve(data)
        })
      })
    })
  }

  bulkRemove (body, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      const table = params.table || this.options.table
      if (!this._.isArray(body))
        return reject(new Error('Require array'))
      this._.each(body, (b, i) => {
        body[i] = b || this.uuid()
      })

      this.client.select('id').from(table)
      .whereIn('id', body).asCallback((err, docs) => {
        if (err)
          return reject(err)
        let info = this._.map(docs, 'id'),
          newBody = this._.clone(body)
        this._.pullAllWith(newBody, info, (i,x) => {
          return i !== x
        })
        async.mapSeries(newBody, (b, cb) => {
          this.client(table).where('id', b).del().asCallback((err, result) => {
            cb(null, err ? { id: b, message: err.message } : null)
          })
        }, (err, result) => {
          let ok = 0, status = []
          this._.each(body, (r, i) => {
            let stat = { success: info.indexOf(r) > -1 ? true : false }
            stat[this.options.idDest] = r
            if (!stat.success)
              stat.message = 'Not found'
            else
              ok++
            status.push(stat)
          })
          let data = {
            success: true,
            stat: {
              ok: ok,
              fail: body.length - ok,
              total: body.length
            },
            data: status
          }
          resolve(data)
        })
      })
    })
  }


}

module.exports = DabKnex