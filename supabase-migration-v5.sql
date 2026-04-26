-- v5: bars 테이블에 branch(지점명) 컬럼 추가
alter table bars add column if not exists branch text;
