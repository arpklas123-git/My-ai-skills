---
name: sql
description: Explain, review, or optimize a SQL query or schema — what it actually returns, why it's slow, what index would help. Use when the user pastes SQL, asks about a query plan, designs a table, or asks why a query is slow.
---

# sql

쿼리와 스키마를 읽고 **뭘 하는지 / 왜 느린지 / 뭘 고쳐야 하는지** 답한다.

## 읽기

쿼리를 설명할 때는 실행 순서로 읽는다. 적힌 순서(SELECT부터)가 아니라 `FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`.

특히 확인할 것:

- **조인 종류와 방향.** `LEFT JOIN` 뒤에 그 테이블 컬럼으로 `WHERE` 를 걸면 사실상 `INNER JOIN` 이 된다. 흔한 버그다.
- **행이 부풀어 있나.** 1:N 조인 뒤에 `SUM` 하면 값이 뻥튀기된다. `COUNT(*)` 와 `COUNT(DISTINCT id)` 를 비교해보게 한다.
- **NULL.** `NOT IN (서브쿼리)` 는 서브쿼리에 NULL이 하나만 있어도 전부 빈 결과가 된다.
- **시간대와 경계.** `BETWEEN` 날짜 두 개는 끝날 자정 이후를 빠뜨린다.

## 느릴 때

추측하지 말고 계획을 본다. `EXPLAIN` (PostgreSQL은 `EXPLAIN (ANALYZE, BUFFERS)`, MySQL은 `EXPLAIN ANALYZE`). 실제 행 수와 예상 행 수가 크게 다르면 통계가 낡은 것이다.

느린 원인은 대개 이 중 하나다.

1. 인덱스가 없어서 풀스캔
2. 인덱스가 있는데 못 쓴다 — 컬럼을 함수로 감쌌거나(`WHERE DATE(created_at) = ...`), 타입이 안 맞거나, 선행 와일드카드(`LIKE '%x'`)
3. 조인 순서가 나빠서 중간 결과가 폭발
4. `SELECT *` 로 안 쓸 컬럼까지 끌어옴
5. 애초에 N+1 — 쿼리가 아니라 애플리케이션 문제

## 인덱스 제안

- 복합 인덱스는 **등호 조건 컬럼 먼저, 범위 조건 컬럼 나중.** 순서가 성능을 가른다.
- 이미 있는 인덱스의 접두사면 새로 만들지 않는다. 먼저 기존 인덱스를 확인한다.
- 쓰기 비용을 같이 말한다. 인덱스는 공짜가 아니다.
- 큰 테이블이면 `CREATE INDEX CONCURRENTLY` (PostgreSQL)를 쓴다. 안 그러면 테이블이 잠긴다.

## 규칙

- **DB에 쓰는 쿼리를 임의로 실행하지 않는다.** `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE INDEX` 는 제안만 하고 사용자가 돌린다. 읽기 쿼리도 운영 DB면 물어본다.
- `UPDATE`/`DELETE` 를 제안할 때는 **같은 `WHERE` 로 `SELECT` 해서 몇 행인지 먼저 보는 것**을 함께 준다.
- 스키마를 모르면 지어내지 말고 물어보거나 `\d table` / `SHOW CREATE TABLE` 을 제안한다.
- DB 종류를 확인한다. PostgreSQL / MySQL / SQLite는 문법도 계획도 다르다.
- 마이그레이션은 되돌리기 어렵다. 되돌리는 방법이 없으면 그렇다고 말한다.
