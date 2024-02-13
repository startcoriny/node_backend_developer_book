const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI; // 몽고디비 연결주소 마지막 링크는 기본 값으로 선택하는 데이터 베이스

process.env.MONGODB_URI;
module.exports = function (callback) {
    // 몽고디비 커넥션 연결함수
    // 사용하는 사람이 몽고디비의 uri의 값을 몰라도 사용할수 있도록 함수를 한번 감싼다
    // 함수의 결과값으로 uri와 콜백함수를 받는 MongoDB.connection()함수를 반환 → mongodb-connection()으로 감싸서 실행.
    // MongoClient.connect()함수는 두번째인수로 mongoDB에 연결된 MongoClient 객체가 주어집니다.
    return MongoClient.connect(uri, callback);
};
