import nock from 'nock';

/* Mock Mailgun Server */
const googleMock = [
  nock('https://oauth2.googleapis.com')
    .post('*')
    .reply(200, {
      id: '<20210227195659.1.C29B37BCC3491ACD@mg.napijs.com>',
      message: 'Test Email Queued. Thank you.',
      messageId: '<20210227195659.1.C29B37BCC3491ACD@mg.napijs.com>'
    })
    .persist()
];

export default googleMock;
