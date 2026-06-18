-- 사용자 표시 환경설정(설정 모달) 서버 동기화용 컬럼 추가.
-- TypeORM synchronize=false 이므로 운영 DB에 수동 적용해야 한다.
-- 대상: TMDM_USER.PREFERENCES (JSON 문자열, NULL = 미설정 → 프런트 기본값 사용)

ALTER TABLE TMDM_USER ADD (PREFERENCES VARCHAR2(2000) NULL);

COMMENT ON COLUMN TMDM_USER.PREFERENCES IS '사용자 표시 환경설정 JSON (pageSize/sortBy/sortOrder/defaultProductLine/density)';
