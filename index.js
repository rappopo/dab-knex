'use strict'

const Dab = require('@rappopo/dab').Dab
const async = require('async')
const docFilter = require('knex-doc-filter')

class DabKnex extends Dab {
  _buildSort (sort) {
    let result = []
    this._.forOwn(sort, (v, k) => {
      result.push(k + ' ' + (v === -1 ? 'desc' : 'asc'))
    })
    return result.join(', ')
  }

  _error (err) {
    let message = ''
    if (err.message.indexOf('no such table: ') > -1) message = 'Collection not found'
    if (this._.isEmpty(message)) return err
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
    if (this.options.client === 'sqlite3') this.options.options.useNullAsDefault = true
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
      coll.srcAttribIdType = coll.srcAttribIdType || 'integer'
    }
    return new Promise((resolve, reject) => {
      super.createCollection(coll)
        .then(result => {
          this.setClient()
          let rebuild = params.rebuild && !this._.isEmpty(this.collection[coll.name].attributes)
          if (!rebuild) return resolve(result)
          return this.client.schema.dropTableIfExists(coll.name)
        })
        .then(result => {
          const cl = this.collection[coll.name]
          return this.client.schema.createTable(coll.name, table => {
            // pk
            const pk = this._.find(cl.attributes, { primaryKey: true })
            if (cl.srcAttribIdType === 'string') {
              table.string(coll.srcAttribId, pk.length || 255).notNullable().primary()
            } else {
              table.increments(coll.srcAttribId).notNullable().primary()
            }
            // columns
            this._.forOwn(cl.attributes, (f, id) => {
              if (id === cl.srcAttribId) return
              let column
              switch (f.type) {
                case 'string':
                  column = table.string(id, f.length)
                  break
                case 'datetime':
                  column = table.dateTime(id)
                  break
                case 'object':
                  column = table.specificType(id, 'json[]')
                  break
                case 'array':
                  const subtype = f.subTypeOf || 'json'
                  column = table.specificType(id, subtype + '[]')
                  break
                default:
                  column = table[f.type](id)
              }
              if (f.validator.required) column.notNullable()
              if (f.default !== undefined) column.defaultTo(f.default)
            })
            // indexes
            this._.forOwn(this.collection[coll.name].indexes, (v, k) => {
              if (v.unique) {
                table.unique(v.column, coll.name + '_' + k)
              } else {
                table.index(v.column, coll.name + '_' + k)
              }
            })
          })
        })
        .then(result => {
          resolve(true)
        })
        .catch(err => {
          reject(this._error(err))
        })
    })
  }

  renameCollection (oldName, newName, params) {
    params = params || {}
    return new Promise((resolve, reject) => {
      super.renameCollection(oldName, newName)
        .then(result => {
          this.setClient()
          let rebuild = params.rebuild && !this._.isEmpty(this.collection[newName].attributes)
          if (!rebuild) return resolve(result)
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
    let rebuild = params.rebuild && this.collection[name] && !this._.isEmpty(this.collection[name].attributes)
    return new Promise((resolve, reject) => {
      super.removeCollection(name)
        .then(result => {
          this.setClient()
          if (!rebuild) return resolve(result)
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
    let limit = params.limit || this.options.limit
    let skip = ((params.page || 1) - 1) * limit
    let sort = this._buildSort(params.sort)
    let query = params.query || {}
    return new Promise((resolve, reject) => {
      let total
      docFilter(this.client(params.collection).count('* as cnt'), query)
        .then(result => {
          total = parseInt(result[0].cnt)
          let sel = this.client(params.collection).limit(limit).offset(skip)
          if (!this._.isEmpty(sort)) sel = sel.orderByRaw(sort)
          return docFilter(sel, query)
        })
        .then(result => {
          let data = {
            success: true,
            total: total,
            data: []
          }
          result.forEach((d, i) => {
            d = this._transformTo(d, params)
            data.data.push(this.convert(d, { collection: params.collection }))
          })
          resolve(data)
        })
        .catch(err => reject(this._error(err)))
    })
  }

  _findOne (id, params, callback) {
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.client(params.collection)
      .where(coll.srcAttribId, id)
      .then(data => {
        if (data.length === 0) {
          return callback(null, {
            success: false,
            err: new Error('Document not found')
          })
        }
        data = {
          success: true,
          data: this._transformTo(data[0], params)
        }
        callback(null, data)
      })
      .catch(err => {
        callback(null, {
          success: false,
          err: this._error(err)
        })
      })
  }

  findOne (id, params) {
    [params] = this.sanitize(params)
    this.setClient(params)
    return new Promise((resolve, reject) => {
      this._findOne(id, params, (e, result) => {
        if (!result.success) return reject(result.err)
        let data = {
          success: true,
          data: this.convert(result.data, { collection: params.collection })
        }
        resolve(data)
      })
    })
  }

  _transformFrom (body, params) {
    if (this.options.client !== 'sqlite3') return body
    const newBody = this._.cloneDeep(body)
    const coll = this.collection[params.collection].attributes
    if (!coll) throw new Error('Collection not found')
    this._.forOwn(newBody, (v, k) => {
      if (coll[k] && ['array', 'object'].indexOf(coll[k].type) > -1) newBody[k] = JSON.stringify(v)
    })
    return newBody
  }

  _transformTo (body, params) {
    if (this.options.client !== 'sqlite3') return body
    const newBody = this._.cloneDeep(body)
    const coll = this.collection[params.collection].attributes
    if (!coll) throw new Error('Collection not found')
    this._.forOwn(newBody, (v, k) => {
      if (!this._.isEmpty(v) && coll[k] && ['array', 'object'].indexOf(coll[k].type) > -1) newBody[k] = JSON.parse(v)
    })
    return newBody
  }

  _create (body, params, callback) {
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    if (!this._.has(body, coll.srcAttribId) && coll.srcAttribIdType === 'string') {
      body[coll.srcAttribId] = this.nanoid(13)
    }
    body = this._transformFrom(body, params)
    this.client(params.collection).insert(body, coll.srcAttribId)
      .then(result => {
        let id = this._.isString(body[coll.srcAttribId]) ? body[coll.srcAttribId] : result[0]
        this._findOne(id, params, callback)
      })
      .catch(err => {
        callback(null, {
          success: false,
          err: this._error(err)
        })
      })
  }

  create (body, params) {
    [params, body] = this.sanitize(params, body)
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (body[coll.srcAttribId]) {
        this._findOne(body[coll.srcAttribId], params, (e, result) => {
          if (result.success) return reject(new Error('Document already exists'))
          this._create(body, params, (e, result) => {
            if (!result.success) return reject(result.err)
            result.data = this.convert(result.data, { collection: params.collection })
            resolve(result)
          })
        })
      } else {
        this._create(body, params, (e, result) => {
          if (!result.success) return reject(result.err)
          result.data = this.convert(result.data, { collection: params.collection })
          resolve(result)
        })
      }
    })
  }

  update (id, body, params) {
    [params, body] = this.sanitize(params, body)
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.setClient(params)
    body = this._.omit(body, [coll.srcAttribId])
    body = this._transformFrom(body, params)
    return new Promise((resolve, reject) => {
      this._findOne(id, params, (e, result) => {
        if (!result.success) return reject(result.err)
        let source = result.data
        this.client(params.collection)
          .where(coll.srcAttribId, id)
          .update(body)
          .then(result => {
            this._findOne(id, params, (e, result) => {
              if (!result.success) return reject(result.err)
              let data = {
                success: true,
                data: this.convert(result.data, { collection: params.collection })
              }
              if (params.withSource) data.source = this.convert(source, { collection: params.collection })
              resolve(data)
            })
          })
          .catch(reject)
      })
    })
  }

  remove (id, params) {
    [params] = this.sanitize(params)
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.setClient(params)
    return new Promise((resolve, reject) => {
      this._findOne(id, params, (e, result) => {
        if (!result.success) return reject(result.err)
        let source = result.data
        this.client(params.collection).where(coll.srcAttribId, id).del()
          .then(result => {
            let data = {
              success: true
            }
            if (params.withSource) data.source = this.convert(source, { collection: params.collection })
            resolve(data)
          })
          .catch(reject)
      })
    })
  }

  bulkCreate (body, params) {
    [params, body] = this.sanitize(params, body)
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (!this._.isArray(body)) return reject(new Error('Requires an array'))

      this._.each(body, (b, i) => {
        if (!b[coll.srcAttribId] && b[coll.srcAttribIdType === 'string']) b[coll.srcAttribId] = this.nanoid(13)
        body[i] = this._transformFrom(b, params)
      })
      const keys = this._(body).map(coll.srcAttribId).value()

      this.client.select(coll.srcAttribId).from(params.collection)
        .whereIn(coll.srcAttribId, keys).asCallback((err, docs) => {
          if (err) return reject(this._error(err))
          let info = this._.map(docs, coll.srcAttribId)
          let newBody = this._.clone(body)
          this._.pullAllWith(newBody, info, (i, x) => {
            return i[coll.srcAttribId] === x
          })
          async.mapSeries(newBody, (b, cb) => {
            this.client(params.collection).insert(b, coll.srcAttribId).asCallback((err, result) => {
              cb(null, err ? { id: b[coll.srcAttribId], message: err.message } : null)
            })
          }, (err, result) => {
            if (err) return reject(err)
            let ok = 0
            let status = []
            this._.each(body, (r, i) => {
              let stat = { success: info.indexOf(r[coll.srcAttribId]) === -1 }
              stat[coll.srcAttribId] = r[coll.srcAttribId]
              if (!stat.success) stat.message = 'Document already exists'
              else ok++
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
            if (params.withDetail) data.detail = status
            resolve(data)
          })
        })
    })
  }

  bulkUpdate (body, params) {
    [params, body] = this.sanitize(params, body)
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (!this._.isArray(body)) return reject(new Error('Requires an array'))
      this._.each(body, (b, i) => {
        if (!b[coll.srcAttribId] && b[coll.srcAttribIdType === 'string']) b[coll.srcAttribId] = this.nanoid(13)
        body[i] = this._transformFrom(b, params)
      })
      const keys = this._(body).map(coll.srcAttribId).value()

      this.client.select(coll.srcAttribId).from(params.collection)
        .whereIn(coll.srcAttribId, keys).asCallback((err, docs) => {
          if (err) return reject(this._error(err))
          let info = this._.map(docs, coll.srcAttribId)
          let newBody = []

          this._.each(body, b => {
            if (info.indexOf(b[coll.srcAttribId]) > -1) newBody.push(b)
          })
          async.mapSeries(newBody, (b, cb) => {
            this.client(params.collection).where(coll.srcAttribId, b[coll.srcAttribId]).update(this._.omit(b, coll.srcAttribId)).asCallback((err, result) => {
              cb(null, err ? { id: b[coll.srcAttribId], message: err.message } : null)
            })
          }, (err, result) => {
            if (err) return reject(err)
            let ok = 0
            let status = []
            this._.each(body, (r, i) => {
              let stat = { success: info.indexOf(r[coll.srcAttribId]) > -1 }
              if (stat.success) {
                let rec = this._.find(result, { id: r[coll.srcAttribId] })
                if (rec) {
                  stat.success = false
                  stat.message = rec.message
                }
              }
              stat[coll.srcAttribId] = r[coll.srcAttribId]
              if (!stat.success && !stat.message) stat.message = 'Document not found'
              else ok++
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
            if (params.withDetail) data.detail = status
            resolve(data)
          })
        })
    })
  }

  bulkRemove (body, params) {
    [params, body] = this.sanitize(params, body)
    const coll = this.collection[params.collection]
    if (!coll) throw new Error('Collection not found')
    this.setClient(params)
    return new Promise((resolve, reject) => {
      if (!this._.isArray(body)) return reject(new Error('Requires an array'))
      this._.each(body, (b, i) => {
        body[i] = b || this.nanoid(13)
      })

      this.client.select(coll.srcAttribId).from(params.collection)
        .whereIn(coll.srcAttribId, body).asCallback((err, docs) => {
          if (err) return reject(this._error(err))
          let info = this._.map(docs, coll.srcAttribId)
          let newBody = []
          this._.each(body, b => {
            if (info.indexOf(b) > -1) newBody.push(b)
          })
          async.mapSeries(newBody, (b, cb) => {
            this.client(params.collection).where(coll.srcAttribId, b).del().asCallback((err, result) => {
              cb(null, err ? { id: b, message: err.message } : null)
            })
          }, (err, result) => {
            if (err) return reject(err)
            let ok = 0
            let status = []
            this._.each(body, (r, i) => {
              let stat = { success: info.indexOf(r) > -1 }
              stat[coll.srcAttribId] = r
              if (!stat.success) stat.message = 'Document not found'
              else ok++
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
            if (params.withDetail) data.detail = status
            resolve(data)
          })
        })
    })
  }
}

module.exports = DabKnex
