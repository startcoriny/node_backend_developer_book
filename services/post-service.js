const paginator = require('../utils/paginator');
const { ObjectId } = require('mongodb');

/** @@@@@@@@@@@@@@@@@@@@@@@@ 글쓰기 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@ **/
async function writePost(collection, post) {
    // 생성일시와 조회수
    post.hits = 0;

    // 날짜는 ISO포맷으로 저장
    // 그 이유는 그래야 시간대가 다른 곳에서도 다양한 포맷으로 변환이 용이하기 때문.
    post.createdDt = new Date().toISOString();

    // 몽고디비에 post를 저장 후 결과 반환
    return await collection.insertOne(post);
}

/** @@@@@@@@@@@@@@@@@@@@@@@@ 글목록리스트 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@ **/
async function list(collection, page, search) {
    const perPage = 10; // 한페이지에 10개의 게시물
    const query = { title: new RegExp(search, 'i') };
    // title이 search와 부분일치하는지 확인
    // sql의 like와 같은 형식의 검색은 정규표현식을 사용
    // 정규표현식의 플래그중 하나인 i
    // search변수에 해당하는 문자열을 포함하고 대소문자를 구별하지 않고 검색하는 정규표현식 객체를 생성

    // limit은 perPage만큼만 가져온다, skip은 설정된 갯수만큼 건너뛴다, 생성일 역순으로 정렬
    const cursor = collection.find(query, { limit: perPage, skip: (page - 1) * perPage }).sort({
        createdDt: -1,
    });

    const totalCount = await collection.count(query);
    const posts = await cursor.toArray(); // 커서로 받아온 데이터들을 리스트로 변경
    const paginatorObj = paginator({ totalCount, page, perPage: perPage });
    return [posts, paginatorObj];
}

/** @@@@@@@@@@@@@@@@@@@@@@@@ 상세페이지 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@ **/

// 패스워드는 노출 할 필요가 없으므로 결괏값으로 가져오지 않는다
const projectionOption = {
    projection: {
        // 프로젝션(투영) 결괏값에서 일부만 가져올 때 사용
        // 프로젝션은 투영이라는 뜻이지만, 데이터베이스에서는 데이터베이스에서 필요한 필드들만 선택해서 가져오는 것을 말한다.
        // ex) 게시글의 패스워드와 게시글에 달린 댓글들의 패스워드 항목을 가져오지 않아도되므로 해당설정 추가
        // 가져오는 항목이 빼는 항목보다 많다면 빼는 항목에 0
        // 빼는항목이 가져오는 항목보다 많다면 가져오는 항목에 1 의 방식을 사용할 수 있다.
        // ex) 빼는 항목 projection:{password:0}\
        // ex) 가져오는 항목 projection:{title:1, content:1}
        password: 0,
        'comments.password': 0,
    },
};

// 역할
// 게시글의 정보를 가져옴, 게시글을 읽을때 마다 hits를 1씩증가.
async function getDetailPost(collection, id) {
    // 몽고디비 Collection의 findOneAndUpdate() 함수를 사용
    // 게시글을 읽을 때마다 hits를 1증가

    /*  findOneAndUpdate()함수
      정의
      db.collection.findOneAndUpdate(filter, update, options)
      filter - 원하는 데이터 가져옴
      update - 필터를 사용해 찾은 도큐먼트에 갱신할 데이터에 대한 내용 넣기
      options - 프로젝션, 소팅 등의 항목을 넣기

  */
    return await collection.findOneAndUpdate(
        { _id: new ObjectId(String(id)) },
        { $inc: { hits: 1 } },
        projectionOption,
    );
}

/** @@@@@@@@@@@@@@@@@@@@@@@@ 상세페이지 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@ **/

async function getPostByIdAndPassword(collection, { id, password }) {
    return await collection.findOne({ _id: new ObjectId(String(id)), password: password }, projectionOption);
}

//id로 데이터 불러오기
async function getPostById(collection, id) {
    return await collection.findOne({ _id: new ObjectId(String(id)) }, projectionOption);
}

// 게시글 수정
async function updatePost(collection, id, post) {
    const toUpdatePost = {
        $set: {
            ...post,
        },
    };
    return await collection.updateOne({ _id: new ObjectId(String(id)) }, toUpdatePost);
}

// require()로 파일을 임포트시 외부로 노출하는 객체
module.exports = {
    writePost,
    list,
    getDetailPost,
    updatePost,
    getPostById,
    getPostByIdAndPassword,
};
