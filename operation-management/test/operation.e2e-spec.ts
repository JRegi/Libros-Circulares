import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { OperationModule } from './../src/operation/operation.module';

const OWNER = 1;
const BORROWER = 2;
const THIRD = 3;
const OUTSIDER = 4;
const COMMUNITY = 10;

describe('Operations (e2e)', () => {
  let app: INestApplication<App>;
  let copyId: number;

  const http = () => request(app.getHttpServer());

  beforeEach(async () => {
    // OperationModule instead of AppModule: AppModule also starts the Observe
    // telemetry agent, whose worker keeps the test process alive.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OperationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    for (const userId of [OWNER, BORROWER, THIRD]) {
      await http()
        .put(`/community/${COMMUNITY}/members/${userId}`)
        .send({ active: true })
        .expect(200);
    }
    const res = await http()
      .post('/copy')
      .send({ ownerUserId: OWNER })
      .expect(201);
    copyId = res.body.copyId;
  });

  afterEach(async () => {
    await app.close();
  });

  const getCopy = async () => (await http().get(`/copy/${copyId}`)).body;

  it('runs a full loan, transfer, return and decommission flow', async () => {
    const loan = await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      })
      .expect(201);
    expect(loan.body).toEqual({ operationId: expect.any(Number) });
    expect(await getCopy()).toMatchObject({
      ownerUserId: OWNER,
      holderUserId: BORROWER,
    });

    await http()
      .get('/operation/open')
      .query({ userId: BORROWER, communityId: COMMUNITY })
      .expect(200)
      .expect({ hasOpenOperations: true });

    await http()
      .post('/operation/ownership-transfer')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: THIRD,
        communityId: COMMUNITY,
      })
      .expect(201);
    expect(await getCopy()).toMatchObject({
      ownerUserId: THIRD,
      holderUserId: BORROWER,
    });

    await http()
      .post('/operation/return')
      .send({ copyId, fromUserId: BORROWER, communityId: COMMUNITY })
      .expect(201);
    expect(await getCopy()).toMatchObject({
      ownerUserId: THIRD,
      holderUserId: THIRD,
    });

    await http()
      .get('/operation/open')
      .query({ userId: BORROWER })
      .expect(200)
      .expect({ hasOpenOperations: false });

    await http()
      .post('/operation/decommission')
      .send({ copyId, userId: THIRD })
      .expect(201);
    expect((await getCopy()).active).toBe(false);

    const history = await http().get('/operation').expect(200);
    expect(history.body.map((o: { type: string }) => o.type)).toEqual([
      'LOAN',
      'OWNERSHIP_TRANSFER',
      'RETURN',
      'DECOMMISSION',
    ]);

    const detail = await http()
      .get(`/operation/${loan.body.operationId}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      operationId: loan.body.operationId,
      type: 'LOAN',
      copyId,
      fromUserId: OWNER,
      toUserId: BORROWER,
      communityId: COMMUNITY,
    });
    expect(new Date(detail.body.date).toString()).not.toBe('Invalid Date');
  });

  it('returns 404 when the copy does not exist', () => {
    return http()
      .post('/operation/loan')
      .send({
        copyId: 123,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      })
      .expect(404);
  });

  it('returns 409 for any operation on a decommissioned copy', async () => {
    await http()
      .post('/operation/decommission')
      .send({ copyId, userId: OWNER })
      .expect(201);

    await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      })
      .expect(409);
    await http()
      .post('/operation/return')
      .send({ copyId, fromUserId: OWNER, communityId: COMMUNITY })
      .expect(409);
    await http()
      .post('/operation/ownership-transfer')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      })
      .expect(409);
    await http()
      .post('/operation/decommission')
      .send({ copyId, userId: OWNER })
      .expect(409);
  });

  it('returns 403 when the owner lends a copy they do not have', async () => {
    await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      })
      .expect(201);

    const res = await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: THIRD,
        communityId: COMMUNITY,
      })
      .expect(403);
    expect(res.body.message).toContain('does not currently have');
  });

  it('returns 403 when a non-owner transfers ownership', () => {
    return http()
      .post('/operation/ownership-transfer')
      .send({
        copyId,
        fromUserId: BORROWER,
        toUserId: THIRD,
        communityId: COMMUNITY,
      })
      .expect(403);
  });

  it('returns 403 when someone without the copy returns it', () => {
    return http()
      .post('/operation/return')
      .send({ copyId, fromUserId: BORROWER, communityId: COMMUNITY })
      .expect(403);
  });

  it('returns 403 when the users are not active in the community', async () => {
    await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: OUTSIDER,
        communityId: COMMUNITY,
      })
      .expect(403);

    await http()
      .put(`/community/${COMMUNITY}/members/${BORROWER}`)
      .send({ active: false })
      .expect(200);
    await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: BORROWER,
        communityId: COMMUNITY,
      })
      .expect(403);
  });

  it('returns 400 for invalid bodies', async () => {
    await http().post('/operation/loan').send({}).expect(400);
    await http()
      .post('/operation/loan')
      .send({
        copyId,
        fromUserId: OWNER,
        toUserId: OWNER,
        communityId: COMMUNITY,
      })
      .expect(400);
    await http()
      .post('/operation/decommission')
      .send({ copyId: String(copyId), userId: OWNER })
      .expect(400);
    await http()
      .post('/operation/return')
      .send({ copyId, fromUserId: OWNER, communityId: COMMUNITY, x: 1 })
      .expect(400);
  });

  it('validates the query and path parameters', async () => {
    await http().get('/operation/open').expect(400);
    await http().get('/operation/open?userId=abc').expect(400);
    await http().get('/operation/abc').expect(400);
    await http().get('/operation/123').expect(404);
  });
});
