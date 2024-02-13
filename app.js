/* 3계층 구조 아키텍처
    - 서버개발에서 가장 보편적으로 사용되는 아키텍처이다.
    - 3계층 구조는 웹프레임워크에서 주로 사용하는 MVC패턴을 적용하기좋다.
    - 컨트롤러, 서비스, 데이터 액세스 계층을 갖는다.
    - 뷰 → 컨트롤러 → 서비스 → 데이터액세스 → 서비스 → 컨트롤러 → 뷰 순으로 진행된다.
    - 컨트롤러에서는 뷰에서 넘어온 요청을 받아서 권한체크, 유효성 검증한뒤 서비스로 넘김
    - 서비스에서는 비즈니스 로직처리를 진행후 데이터 액세스 계층과 데이터 주고받음
    - 익스프레스에서는 컨트롤러의 역할을 라우터에서 한다.
*/

const express = require('express');
const handlebars = require('express-handlebars');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3002;

const mongodbConnection = require('./configs/mongodb-connection'); // 만들어둔 몽고디비 연결용 함수 임포트,
const postService = require('./services/post-service');
const { ObjectId } = require('mongodb');

// req.body와 post요청을 해석하기 위한 설정.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 템플릿 엔진으로 핸들바 등록, 파일의 확장자로 사용할 이름,  기본형태가 되는 템플릿 파일 선언, 핸들바 생성및 엔진반환.
// helpers로 커스텀 헬퍼함수 추가.
app.engine(
    'handlebars',
    handlebars.create({
        helpers: require('./configs/handlebars-helpers'),
    }).engine,
);

app.set('view engine', 'handlebars'); // 웹페이지 로드 시 사용할 템플릿 엔진 설정
app.set('views', __dirname + '/views'); // 뷰 디렉터리를 views로 설정, __dirname은 node를 실행하는 디렉터리 경로

// 메인 자료 리스트 페이지
app.get('/', async (req, res) => {
    // 라우팅하는 패스 / 지정, 해당 경로로 들어올 시 콜백함수 실행.
    const page = +req.query.page || 1; // 현재 페이지 데이터
    const search = req.query.search || ''; // 검색어 데이터
    try {
        // postService.list에서 글 목록과 페이지네이터를 가져옴
        const [posts, paginator] = await postService.list(collection, page, search);

        res.render('home', { title: '테스트 게시판', search, paginator, posts });
    } catch (error) {
        console.log(error);
        res.render('home', { title: '테스트 게시판' }); // home은 템플릿 파일의 이름.
        // 에러가 났을땐 빈값으로 랜더링
    }
}); //views가 기본 경로 이고 handlebars가 확장자 이므로 localhost:3000/views/home.handlebars가 최종 경로가 됨,  해당 경로로 라우팅,

// 글쓰기 페이지
app.post('/write', async (req, res) => {
    const post = req.body;

    const result = await postService.writePost(collection, post);
    res.redirect(`/detail/${result.insertedId}`);
});

// 쓰기 페이지 이동
app.get('/write', (req, res) => {
    res.render('write', { title: '테스트 게시판', mode: 'create' });
});

// 상세페이지 보기 페이지
app.get('/detail/:id', async (req, res) => {
    console.log(req.params.id);
    const result = await postService.getDetailPost(collection, req.params.id);
    console.log('result1 => ', result.comments);
    res.render('detail', { title: '테스트 게시판', post: result });
});

// 비밀번호 체크
app.post('/check-password', async (req, res) => {
    const { id, password } = req.body;

    const post = await postService.getPostByIdAndPassword(collection, { id, password });

    if (!post) {
        return res.status(404).json({ isExist: false });
    } else {
        return res.json({ isExist: true });
    }
});

// 수정페이지로 이동 mode는 modify
app.get('/modify/:id', async (req, res) => {
    const post = await postService.getPostById(collection, req.params.id);
    console.log(post);
    res.render('write', { title: '테스트 게시판', mode: 'modify', post });
});

// 게시글 수정 api
app.post('/modify/', async (req, res) => {
    const { id, title, writer, password, content } = req.body;

    const post = {
        title,
        writer,
        password,
        content,
        createdDt: new Date().toISOString(),
    };

    const result = postService.updatePost(collection, id, post);
    res.redirect(`/detail/${id}`);
});

// 게시물 삭제하기
app.delete('/delete', async (req, res) => {
    const { id, password } = req.body;
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(String(id)), password: password });
        console.log('삭제 성공 여부 번호 => ', result);
        if (result.deletedCount !== 1) {
            console.log('삭제 실패');
            return res.json({ isSuccess: false });
        }
        return res.json({ isSuccess: true });
    } catch (error) {
        console.error(error);
        return res.json({ isSuccess: false });
    }
});

// 댓글 작성하기
app.post('/write-comment', async (req, res) => {
    const { id, name, password, comment } = req.body;
    const post = await postService.getPostById(collection, id);

    if (post.comments) {
        post.comments.push({
            idx: post.comments.length + 1,
            name,
            password,
            comment,
            createdDt: new Date().toISOString(),
        });
    } else {
        post.comments = [
            {
                idx: 1,
                name,
                password,
                comment,
                createdDt: new Date().toISOString(),
            },
        ];
    }
    postService.updatePost(collection, id, post);
    return res.redirect(`/detail/${id}`);
});

// 댓글 삭제
app.delete('/delete-comment', async (req, res) => {
    const { id, idx, password } = req.body;
    console.log('id => ', id);
    console.log('idx => ', idx);
    console.log('password => ', password);

    const post = await collection.findOne(
        {
            _id: new ObjectId(String(id)),
            comments: { $elemMatch: { idx: parseInt(idx), password } },
        },
        postService.projectionOption,
    );
    console.log('post의 정보는 => ', post);

    if (!post) {
        return res.json({ isSuccess: false });
    }

    post.comments = post.comments.filter(comment => comment.idx != idx);
    postService.updatePost(collection, id, post);
    return res.json({ isSuccess: true });
});

let collection;
app.listen(PORT, async () => {
    console.log(`${PORT}로 서버가 시작됨`);
    const mongoClient = await mongodbConnection(); // 여기에 콜백이 없으므로 MongoClient객체를 반환 .
    collection = mongoClient.db().collection('Post'); // .db()를 사용해 데이터베이스 선택하고 collection을 사용해 컬렉션을 선택
    console.log('MongoDB connected');
});
