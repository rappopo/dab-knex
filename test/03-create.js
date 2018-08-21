'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect

chai.use(chaiAsPromised)

const Cls = require('../index')
const lib = require('./_lib')
const body = {
  id: 'jason-bourne',
  name: 'Jason Bourne'
}

let cls

describe('create', function () {
  beforeEach(function (done) {
    this.timeout(lib.timeout)
    lib.resetDb(function (err) {
      if (err) throw err
      done()
    })
  })

  afterEach(function (done) {
    cls.client.destroy(function () {
      done()
    })
  })

  it('should return error if collection doesn\'t exist', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.create(body, { collection: 'none' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Collection not found')
        done()
      })
  })

  it('should return error if doc exists', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.create(lib.docs[0], { collection: 'test' })
      })
      .catch(err => {
        expect(err).to.be.a('error').and.have.property('message', 'Document already exists')
        done()
      })
  })

  it('should return the correct value', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schema)
      .then(result => {
        return cls.create(body, { collection: 'test' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.data).to.have.property('id', 'jason-bourne')
        expect(result.data).to.have.property('name', 'Jason Bourne')
        done()
      })
  })

  it('should return enforced values according to its definitions', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaFull)
      .then(result => {
        return cls.create(body, { collection: 'full' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.data).to.have.property('id', 'jason-bourne')
        expect(result.data).to.have.property('name', 'Jason Bourne')
        expect(result.data).to.have.property('age', null)
        done()
      })
  })

  it('should return enforced values with hidden columns', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaHidden)
      .then(result => {
        return cls.create(body, { collection: 'hidden' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.data).to.have.property('id', 'jason-bourne')
        expect(result.data).to.not.have.property('name')
        expect(result.data).to.have.property('age', null)
        done()
      })
  })

  it('should return enforced values with masks', function (done) {
    cls = new Cls(lib.options)
    cls.createCollection(lib.schemaMask)
      .then(result => {
        return cls.create({ id: 'jason-bourne', fullname: 'Jason Bourne' }, { collection: 'mask' })
      })
      .then(result => {
        expect(result.success).to.equal(true)
        expect(result.data).to.have.property('_id', 'jason-bourne')
        expect(result.data).to.have.property('fullname', 'Jason Bourne')
        expect(result.data).to.have.property('age', null)
        done()
      })
  })
})
