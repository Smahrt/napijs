import { DbHelper } from '../../src/helpers';
import { Admin, User } from '../../src/models/user';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Database Helper', () => {
  it('should delete a document', () => {
    const doc = new Admin();
    return expect(DbHelper.deleteDocument(doc)).to.eventually.have.property('_id');
  });

  it('should delete many documents', () => {
    return expect(DbHelper.deleteMany(Admin, { email: 'admins@g.co' })).to.eventually.be.fulfilled;
  });

  it('should return count without query', () => {
    return expect(DbHelper.count(User)).to.eventually.be.fulfilled;
  });

  it('should return count with query', () => {
    return expect(DbHelper.count(User, { role: 'Member' })).to.eventually.be.fulfilled;
  });

  it('should throw an error if update params is not an object', () => {
    const doc = new Admin();
    return expect(DbHelper.update(doc, 'stooges', [])).to.be.rejectedWith('params is not an object');
  });

  it('should update a doc provided its model', () => {
    const doc = new Admin();
    return expect(DbHelper.update(doc, { name: 'stooges' }, [], Admin)).to.eventually.be.fulfilled;
  });

  it('should perform lookup with select fields as output', () => {
    return expect(DbHelper.aggregate(User, [
      ...DbHelper.lookup({ from: 'users', localField: '_id', as: 'userField', select: 'name' }, true)
    ])).to.eventually.be.fulfilled;
  });
});
