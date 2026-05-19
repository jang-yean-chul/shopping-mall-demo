import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGetUsers } from '@/api/admin';
import Pagination from '@/components/common/Pagination';

const GENDER_LABEL = { M: '남성', F: '여성', other: '기타' };
const LIMIT = 10;

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminGetUsers({ page, limit: LIMIT, search: search || undefined }).then((r) => r.data),
  });

  const users      = data?.users      ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const emptyMsg = search ? `"${search}" 검색 결과가 없습니다.` : '회원이 없습니다.';

  const renderTable = () => {
    if (isLoading) return <p className="admin-loading">불러오는 중...</p>;
    if (users.length === 0) return <p className="admin-empty">{emptyMsg}</p>;
    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>연락처</th>
            <th>성별</th>
            <th>권한</th>
            <th>상태</th>
            <th>가입일</th>
            <th>최근 로그인</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{GENDER_LABEL[u.gender] ?? '-'}</td>
              <td>
                <span className={`admin-badge admin-badge--${u.user_type}`}>
                  {u.user_type === 'admin' ? '관리자' : '일반회원'}
                </span>
              </td>
              <td>
                <span className={`admin-badge admin-badge--${u.is_active ? 'active' : 'inactive'}`}>
                  {u.is_active ? '활성' : '비활성'}
                </span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
              <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('ko-KR') : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <h1 className="admin-page-title">회원 관리</h1>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-title">전체 회원 ({total}건)</span>
          <form className="admin-search-form" onSubmit={handleSearch}>
            <input
              className="admin-search-input"
              placeholder="이름 · 이메일 · 연락처 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="admin-btn admin-btn--primary">검색</button>
            {search && (
              <button type="button" className="admin-btn admin-btn--outline" onClick={handleReset}>
                초기화
              </button>
            )}
          </form>
        </div>

        {renderTable()}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
