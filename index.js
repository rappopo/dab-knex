'use strict'

const path = require('path'),
  Dab = require('@rappopo/dab').Dab,
  async = require('async'),
  docFilter = require('knex-doc-filter')

class DabKnex extends Dab {
  constructor (options) {
    super(options)
  }

  _buildSort (sort) {
    let result = []
    this._.forOwn(sort, (v, k) => {
      result.push(k + ' ' + (v === -1 ? 'desc' : 'asc'))
    })
    return result.join(', ')
  }

  _error (err) {
    let message = ''
    if (err.message.indexOf('no such table: ') > -1)
      message = 'Collection not found'
    if (this._.isEmpty(message))
      return err
    let e = new Error(message)
    e.source = err
    return e
  }

  setOptions (options) {
    super.setOptions(this._.merge(this.options, {
      client: options.client || 'sqlite3',
      connection: options.connection || {
        filename: '/tmp/default.sqlite3'
      },
      debug: options.debug
    }))
    if (this.options.client === 'sqlite3')
      this.options.options.useNullAsDefault = true
  }

  setClient () {
    if (this.client) return
    let opt = this._.merge(this.options.options, {
      client: this.options.client,
      connection: this.options.connection
    })
    this.client = require('knex')(opt)
    return this
  }

  createCollection (coll, params) {
    params = params || {}
    if (this._.isPlainObject(coll)) {
      coll.srcAttribName = 'table'
      coll.srcAttribId = 'id'
      coll.srcAttribIdType = 'string'
    }
    return new Promise((resolve, reject) => {
      super.createCollection(coll)
        .then(result => {
          this.setClient()
          let rebuild = params.withSchema && !this._.isEmpty(this.collection[coll.name].attributes)
          if (!rebuild)
            return resolve(result)
          return this.client.schema.dropTableIfExists(coll.name)
        })
        .then(result => {
          return this.client.schema.createTable(coll.name, table => {
            this._.forOwn(this.collection[coll.name].attributes, (f, id) => {
              let column
              switch(f.type) {
                case 'string':
                  column = table.string(id, f.length)
                  break
                case 'datetime':
                  column = table.dateTime(id)
                default:
                  column = table[f.type](id)
              }
              if (f.validator.required)
                column.notNullable()
              if (f.default !== undefined)
                column.defaultTo(f.default)
            })
          })
        })
        .then(result => {
          resolve(true)
        })
        .catch(err => reject(this._error(err)))
    })
  }

  renameCollection (oldName, newName, params) {
    params = params || {}
    return new Promise((resolve, reject) => {
      super.renameCollection(oldName, newName)
        .then(result => {
          this.setClient()
          let rebuild = params.withSchema && !this._.isEmpty(this.collection[newName].attributes)
          if (!rebuild)
            return resolve(result)
          return this.client.schema.renameTable(oldName, newName)
        })
        .then(result => {
          resolve(true)
        })
        .catch(err => reject(this._error(err)))
    })
  }

  removeCollection (name, params) {
    params = params || {}
    let rebuild = params.withSchema && this.collection[name] && !this._.isEmpty(this.collection[name].attributes)
    return new Promise((resolve, reject) => {
      super.removeCollection(name)
        .then(result => {
          this.setClient()
          if (!rebuild)
            return resolve(result)
          return this.client.schema.dropTableIfExists(name)
        })
        .then(result => {
          resolve(true)
        })
        .catch(err => reject(this._error(err)))
    })
  }

  find (params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    let limit = params.limit || this.options.limit,
      skip = ((params.page || 1) - 1) * limit,
      sort = this._buildSort(params.sort),
      query = params.query || {}
    return new Promise((resolve, reject) => {
      let total
      docFilter(this.client(params.collection).count('* as cnt'), query)
      .then(result => {
        total = parseInt(result[0].cnt)
        let sel = this.client(params.collection).limit(limit).offset(skip)
        if (!this._.isEmpty(sort))
          sel = sel.orderByRaw(sort)
        return docFilter(sel, query)
      })
      .then(result => {
        let data = {
          success: true,
          total: total,
          data: []
        }
        result.forEach((d, i) => {
          data.data.push(this.convert(d, { collection: params.collection }))
        })
        resolve(data)
      })
      .catch(err => reject(this._error(err)))
    })
  }

  _findOne (id, params, callback) {
    this.client(params.collection)
    .where('id', id)
    .then(data => {
      if (data.length === 0) {
        return callback({
          success: false,
          err: new Error('Document not found')
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
        err: this._error(err)
      })
    })
  }

  findOne (id, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      this._findOne(id, params, result => {
        if (!result.success)
          return reject(result.err)
        let data = {
          success: true,
          data: this.convert(result.data, { collection: params.collection })
        }
        resolve(data)
      })
    })
  }

  _create (body, params, callback) {
    this.client(params.collection).insert(body, 'id')
    .then(result => {
      let id = this._.isString(body.id) ? body.id : result[0]
      this._findOne(id, params, callback)
    })
    .catch(err => {
      callback({
        success: false,
        err: this._error(err)
      })
    })
  }

  create (body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (body.id) {
        this._findOne(body.id, params, result => {
          if (result.success)
            return reject(new Error('Document already exists'))
          this._create(body, params, result => {
            if (!result.success)
              return reject(result.err)
            result.data = this.convert(result.data, { collection: params.collection })
            resolve(result)
          })
        })
      } else {
        this._create(body, params, result => {
          if (!result.success)
            return reject(result.err)
          result.data = this.convert(result.data, { collection: params.collection })
          resolve(result)
        })
      }
    })
  }

  update (id, body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    body = this._.omit(body, ['id'])
    return new Promise((resolve, reject) => {
      this._findOne(id, params, result => {
        if (!result.success)
          return reject(result.err)
        let source = result.data
        this.client(params.collection)
        .where('id', id)
        .update(body)
        .then(result => {
          this._findOne(id, params, result => {
            if (!result.success)
              return reject(result.err)
            let data = {
              success: true,
              data: this.convert(result.data, { collection: params.collection })
            }
            if (params.withSource)
              data.source = this.convert(source, { collection: params.collection })
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
        this.client(params.collection).where('id', id).del()
        .then(result => {
          let data = {
            success: true
          }
          if (params.withSource)
            data.source = this.convert(source, { collection: params.collection })
          resolve(data)
        })
        .catch(reject)
      })
    })
  }

  bulkCreate (body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (!this._.isArray(body))
        return reject(new Error('Requires an array'))

      this._.each(body, (b, i) => {
        if (!b.id)
          b.id = this.uuid()
        body[i] = b
      })
      const keys = this._(body).map('id').value()


      this.client.select('id').from(params.collection)
      .whereIn('id', keys).asCallback((err, docs) => {
        if (err)
          return reject(this._error(err))
        let info = this._.map(docs, 'id'),
          newBody = this._.clone(body)
        this._.pullAllWith(newBody, info, (i,x) => {
          return i.id === x
        })
        async.mapSeries(newBody, (b, cb) => {
          this.client(params.collection).insert(b, 'id').asCallback((err, result) => {
            cb(null, err ? { id: b.id, message: err.message } : null)
          })
        }, (err, result) => {
          let ok = 0, status = []
          this._.each(body, (r, i) => {
            let stat = { success: info.indexOf(r.id) === -1 ? true : false }
            stat.id = r.id
            if (!stat.success)
              stat.message = 'Document already exists'
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
            }
          }
          if (params.withDetail)
            data.detail = status
          resolve(data)
        })
      })
    })
  }

  bulkUpdate (body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (!this._.isArray(body))
        return reject(new Error('Requires an array'))

      this._.each(body, (b, i) => {
        if (!b.id)
          b.id = this.uuid()
        body[i] = b
      })
      const keys = this._(body).map('id').value()

      this.client.select('id').from(params.collection)
      .whereIn('id', keys).asCallback((err, docs) => {
        if (err)
          return reject(this._error(err))
        let info = this._.map(docs, 'id'),
          newBody = []

        this._.each(body, b => {
          if (info.indexOf(b.id) > -1)
            newBody.push(b)
        })
        async.mapSeries(newBody, (b, cb) => {
          this.client(params.collection).where('id', b.id).update(this._.omit(b, 'id')).asCallback((err, result) => {
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
            stat.id = r.id
            if (!stat.success && !stat.message)
              stat.message = 'Document not found'
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
            }
          }
          if (params.withDetail)
            data.detail = status
          resolve(data)
        })
      })
    })
  }

  bulkRemove (body, params) {
    [params, body] = this.sanitize(params, body)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (!this._.isArray(body))
        return reject(new Error('Requires an array'))
      this._.each(body, (b, i) => {
        body[i] = b || this.uuid()
      })

      this.client.select('id').from(params.collection)
      .whereIn('id', body).asCallback((err, docs) => {
        if (err)
          return reject(this._error(err))
        let info = this._.map(docs, 'id'),
          newBody = []
        this._.each(body, b => {
          if (info.indexOf(b) > -1)
            newBody.push(b)
        })
        async.mapSeries(newBody, (b, cb) => {
          this.client(params.collection).where('id', b).del().asCallback((err, result) => {
            cb(null, err ? { id: b, message: err.message } : null)
          })
        }, (err, result) => {
          let ok = 0, status = []
          this._.each(body, (r, i) => {
            let stat = { success: info.indexOf(r) > -1 ? true : false }
            stat.id = r
            if (!stat.success)
              stat.message = 'Document not found'
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
            }
          }
          if (params.withDetail)
            data.detail = status
          resolve(data)
        })
      })
    })
  }


}

module.exports = DabKnex