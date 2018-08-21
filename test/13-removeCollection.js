'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect

chai.use(chaiAsPromised)

const Cls = require('../index')
const lib = require('./_lib')

let cls

describe('removeCollection', function () {
  afterEach(function (done) {
    if (!cls.client) return done()
    cls.client.destroy(function () {
      done()
    })
  })

  it('should return error if no collection provided', function () {
    cls = new Cls(lib.options)
    return expect(cls.removeCollection()).to.be.rejectedWith('Requires collection name')
  })

  it('should return error if collection doesn\'t exist', function () {
    cls = new Cls(lib.options)
    return expect(cls.removeCollection('test')).to.be.rejectedWith('Collection not found')
  })

  it('should return success', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection({ name: 'test' })
      .then(result => {
        return cls.removeCollection('test')
      })
      .then(result => {
        expect(result).to.equal(true)
        done()
      })
  })

  it('should forced you to destroy associated table', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection({
      name: 'newtable',
      attributes: {
        id: { type: 'string', default: 'myid', required: true },
        title: { type: 'string', required: true },
        draft: { type: 'boolean', default: true },
        content: { type: 'text', required: true }
      }
    }, { withSchema: true })
      .then(result => {
        return cls.removeCollection('newtable', { withSchema: true })
      })
      .then(result => {
        expect(result).to.equal(true)
        done()
      })
  })
})
