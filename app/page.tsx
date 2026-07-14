'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 💡 【硬编码凭证】直接硬编码，规避 Vercel 环境变量隐患
// ==========================================
const rawUrl = 'https://dqspprzxyqwtgkwzuweg.supabase.co';
const rawKey = 'sb_publishable_xWVmfXjPbBM45y9xyhlcLA_y-Jz8cx-';

const supabase = createClient(rawUrl, rawKey);

// 🎯 您提供的精确中分类映射表
const MAIN_CAT_MAPPING: { [key: string]: string[] } = {
  "アパレル": ["ジャケット・ブルゾン", "コート", "スーツ・セットアップ", "ダウンジャケット・コート", "トップス", "ワンピース", "Tシャツ", "ポロシャツ", "シャツ", "パンツ", "スカート", "ニット・セーター", "カーディガン", "アンサンブル", "パーカー", "ベスト", "ジャージ・スウェット", "キャミソール・チュニック", "オールインワン", "その他"],
  "靴": ["レザーシューズ", "スニーカー", "ブーツ", "サンダル", "パンプス", "ローファー", "スリッポン", "フラットシューズ", "その他"],
  "小物": ["マフラー・ストール", "カレ・スカーフ", "メガネ・サングラス", "帽子", "ネクタイ", "手袋", "ベルト・バックル", "アクセサリー", "ネックレス", "リング", "ピアス・イヤリング", "ブレスレット・バングル", "財布・マネークリップ", "カードケース・コインケース", "ペン・筆記用具", "キーリング・キーホルダー・キーケース", "ポーチ", "傘", "その他"],
  "バッグ": ["ショルダーバッグ", "ハンドバッグ", "リュック", "ボストンバッグ", "ウエストバッグ", "セカンドバッグ", "トートバッグ", "クラッチバッグ", "エコバッグ", "かごバッグ", "バニティバッグ", "その他"],
  "時計": ["腕時計", "置き時計", "掛け時計", "懐中時計", "時計ベルト・コマ", "その他"],
  "毛皮": ["コート", "ショール", "その他"]
};

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 输入框文字状态（允许输入，只有点击搜索按钮或回车时才触发真正的过滤）
  const [typedSearchTerm, setTypedSearchTerm] = useState('');
  // 实际生效的搜索关键词
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  // 筛选控制状态
  const [selectedMainCat, setSelectedMainCat] = useState('ALL');
  const [selectedSubCat, setSelectedSubCat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [itemsPerPage, setItemsPerPage] = useState(100);
  
  // 日期筛选范围
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 排序状态控制: 'none' | 'asc' | 'desc'
  const [priceSortState, setPriceSortState] = useState<'none' | 'asc' | 'desc'>('none');
  const [dateSortState, setDateSortState] = useState<'none' | 'asc' | 'desc'>('none');

  // 📊 当前页码状态
  const [currentPage, setCurrentPage] = useState(1);

  // 弹窗控制状态
  const [activeModalItem, setActiveModalItem] = useState<any | null>(null);

  // 从 Supabase 获取数据并进行智能分类纠错
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from('jaa_items')
          .select('*');

        if (dbError) throw dbError;

        if (data) {
          const processedData = data.map((item: any) => {
            let subCat = String(item['中分類'] || item['小分類'] || '').trim();
            const title = `${item['特徴'] || ''} ${item['商品名'] || item['商品詳細'] || ''}`;

            // 💡 智能分类纠错器（自动修复 "その他" 或空白到对应的精准细分类目）
            if (subCat.includes('その他') || !subCat) {
              if (title.includes('ポーチ')) subCat = 'ポーチ';
              else if (title.includes('カレ') || title.includes('スカーフ')) subCat = 'カレ・スカーフ';
              else if (title.includes('マフラー') || title.includes('ストール')) subCat = 'マフラー・ストール';
              else if (title.includes('サングラス') || title.includes('メガネ')) subCat = 'メガネ・サングラス';
              else if (title.includes('ネクタイ')) subCat = 'ネクタイ';
              else if (title.includes('手袋')) subCat = '手袋';
              else if (title.includes('ベルト') || title.includes('バックル')) subCat = 'ベルト・バックル';
              else if (title.includes('財布') || title.includes('ウォレット') || title.includes('マネークリップ')) subCat = '財布・マネークリップ';
              else if (title.includes('小銭入れ') || title.includes('コインケース') || title.includes('カードケース')) subCat = 'カードケース・コインケース';
              else if (title.includes('キーケース') || title.includes('キーホルダー') || title.includes('キーリング')) subCat = 'キーリング・キーホルダー・キーケース';
              else if (title.includes('ネックレス') || title.includes('ペンダント')) subCat = 'ネックレス';
              else if (title.includes('ピアス') || title.includes('イヤリング')) subCat = 'ピアス・イヤリング';
              else if (title.includes('リング') || title.includes('指輪')) subCat = 'リング';
              else if (title.includes('ブレスレット') || title.includes('バングル')) subCat = 'ブレスレット・バングル';
              else if (title.includes('ショルダー')) subCat = 'ショルダーバッグ';
              else if (title.includes('トート')) subCat = 'トートバッグ';
              else if (title.includes('リュック') || title.includes('バックパック')) subCat = 'リュック';
              else if (title.includes('ハンドバッグ')) subCat = 'ハンドバッグ';
              else if (title.includes('ボストン')) subCat = 'ボストンバッグ';
              else if (title.includes('ウエスト')) subCat = 'ウエストバッグ';
              else if (title.includes('セカンド')) subCat = 'セカンドバッグ';
              else if (title.includes('クラッチ')) subCat = 'クラッチバッグ';
              else if (title.includes('バニティ')) subCat = 'バニティバッグ';
              else if (title.includes('スニーカー')) subCat = 'スニーカー';
              else if (title.includes('ブーツ')) subCat = 'ブーツ';
              else if (title.includes('サンダル')) subCat = 'サンダル';
              else if (title.includes('パンプス')) subCat = 'パンプス';
              else if (title.includes('ローファー')) subCat = 'ローファー';
              else if (title.includes('ジャケット') || title.includes('ブルゾン')) subCat = 'ジャケット・ブルゾン';
              else if (title.includes('コート')) subCat = 'コート';
              else if (title.includes('ダウン')) subCat = 'ダウンジャケット・コート';
              else if (title.includes('Tシャツ')) subCat = 'Tシャツ';
              else if (title.includes('シャツ')) subCat = 'シャツ';
              else if (title.includes('パンツ')) subCat = 'パンツ';
              else if (title.includes('スカート')) subCat = 'スカート';
              else if (title.includes('ニット') || title.includes('セーター')) subCat = 'ニット・セーター';
              else if (title.includes('腕時計')) subCat = '腕時計';
              else if (subCat === '') subCat = 'その他';
            }

            // 推断大分类规则
            let calculatedMainCat = String(item['大分類'] || '').trim();
            if (!calculatedMainCat || calculatedMainCat === 'undefined') {
              calculatedMainCat = '小物'; // 默认 fallback
              for (const [mainKey, subList] of Object.entries(MAIN_CAT_MAPPING)) {
                if (subList.some(sub => subCat.includes(sub))) {
                  calculatedMainCat = mainKey;
                  break;
                }
              }
            }

            return {
              ...item,
              '大分類': calculatedMainCat,
              '中分類': subCat,
            };
          });

          setItems(processedData);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 触发实际搜索的方法
  const executeSearch = () => {
    setActiveSearchTerm(typedSearchTerm);
    setCurrentPage(1); // 搜索时重置回第一页
  };

  // 监听回车键直接搜索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // 价格清理转换工具
  const parsePrice = (val: any): number => {
    if (!val) return 0;
    const cleanVal = String(val).replace('¥', '').replace(/,/g, '').trim();
    const num = parseFloat(cleanVal);
    return !isNaN(num) ? Math.floor(num) : 0;
  };

  const formatPrice = (val: any) => {
    const num = parsePrice(val);
    return num > 0 ? `¥${num.toLocaleString()}` : '-';
  };

  // 日期排序逻辑切换
  const toggleDateSort = () => {
    setPriceSortState('none');
    setCurrentPage(1);
    if (dateSortState === 'none') setDateSortState('desc');
    else if (dateSortState === 'desc') setDateSortState('asc');
    else setDateSortState('none');
  };

  // 价格排序逻辑切换
  const togglePriceSort = () => {
    setDateSortState('none');
    setCurrentPage(1);
    if (priceSortState === 'none') setPriceSortState('asc');
    else if (priceSortState === 'asc') setPriceSortState('desc');
    else setPriceSortState('none');
  };

  // 根据当前选中的大分类，动态锁定关联的中分类下拉框选项
  const availableSubCategories = ['ALL'];
  if (selectedMainCat !== 'ALL') {
    if (MAIN_CAT_MAPPING[selectedMainCat]) {
      availableSubCategories.push(...MAIN_CAT_MAPPING[selectedMainCat]);
    }
  } else {
    // 选 ALL 时，把所有映射表的中分类都合并排列出来
    const allSubs = Object.values(MAIN_CAT_MAPPING).flat();
    availableSubCategories.push(...Array.from(new Set(allSubs)).sort());
  }

  // 大分类变动重置小分类和页码
  const handleMainCatChange = (val: string) => {
    setSelectedMainCat(val);
    setSelectedSubCat('ALL');
    setCurrentPage(1);
  };

  // 数据检索核心过滤与排序逻辑
  const filteredAndSortedItems = items.filter(item => {
    const searchString = `${item['ブランド']} ${item['特徴']} ${item['中分類']} ${item['箱番']} ${item['商品番号']} ${item['出品者']} ${item['商品名']}`.toLowerCase();
    const matchesSearch = searchString.includes(activeSearchTerm.toLowerCase());
    
    const matchesMainCat = selectedMainCat === 'ALL' || item['大分類'] === selectedMainCat;
    const matchesSubCat = selectedSubCat === 'ALL' || item['中分類'] === selectedSubCat;
    
    const itemStatus = String(item['状態詳細'] || item['ランク'] || '');
    const matchesStatus = selectedStatus === 'ALL' || itemStatus.toLowerCase().includes(selectedStatus.toLowerCase());

    const itemDateStr = item['大会開催日'] || item['日付'] || '';
    let matchesDate = true;
    if (itemDateStr) {
      const itemTime = new Date(itemDateStr).getTime();
      if (startDate) {
        const startTarget = new Date(startDate).getTime();
        if (itemTime < startTarget) matchesDate = false;
      }
      if (endDate) {
        const endTarget = new Date(endDate).getTime();
        if (itemTime > endTarget) matchesDate = false;
      }
    } else if (startDate || endDate) {
      matchesDate = false;
    }

    return matchesSearch && matchesMainCat && matchesSubCat && matchesStatus && matchesDate;
  }).sort((a, b) => {
    if (priceSortState !== 'none') {
      const priceA = parsePrice(a['自社指値'] || a['指値2'] || a['指値']);
      const priceB = parsePrice(b['自社指値'] || b['指値2'] || b['指値']);
      return priceSortState === 'asc' ? priceA - priceB : priceB - priceA;
    }
    if (dateSortState !== 'none') {
      const dateA = new Date(a['大会開催日'] || a['日付'] || 0).getTime();
      const dateB = new Date(b['大会開催日'] || b['日付'] || 0).getTime();
      return dateSortState === 'asc' ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  // 📝 智能计算翻页逻辑切片
  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  // 安全限制当前页码边界
  const safeCurrentPage = currentPage > totalPages ? totalPages : currentPage;
  
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  return (
    <div className="container">
      {/* 顶部优雅的粉色框搜索控制面板 */}
      <div className="search-panel">
        <div className="search-row">
          <div className="search-group">
            <input
              type="text"
              placeholder="特徴、型番、ブランド、箱番などを入力..."
              value={typedSearchTerm}
              onChange={(e) => setTypedSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {/* 🎯 新增的实体搜索键 */}
            <button className="btn-search" onClick={executeSearch}>検索</button>
          </div>
        </div>

        {/* 条件筛选与高亮排序组 */}
        <div className="filter-row">
          <div className="filter-item">
            <span>大分類:</span>
            <select value={selectedMainCat} onChange={(e) => handleMainCatChange(e.target.value)}>
              <option value="ALL">すべて (ALL)</option>
              <option value="アパレル">アパレル</option>
              <option value="靴">靴</option>
              <option value="小物">小物</option>
              <option value="バッグ">バッグ</option>
              <option value="時計">時計</option>
              <option value="毛皮">毛皮</option>
            </select>
          </div>

          <div className="filter-item">
            <span>小分類:</span>
            <select value={selectedSubCat} onChange={(e) => { setSelectedSubCat(e.target.value); setCurrentPage(1); }}>
              {availableSubCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span>状態:</span>
            <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}>
              {["ALL", "N", "S", "SA", "A", "AB", "B", "BC", "C"].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span>表示件数:</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value="50">50件</option>
              <option value="100">100件</option>
              <option value="500">500件</option>
              <option value="1000">1000件</option>
            </select>
          </div>

          <div className="filter-item">
            <span>開始日:</span>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
          </div>
          
          <div className="filter-item">
            <span>終了日:</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
          </div>

          {/* 排序键 */}
          <div className="filter-item" style={{ marginLeft: 'auto', gap: '10px' }}>
            <button 
              className={`btn-sort ${priceSortState !== 'none' ? 'active' : ''}`}
              onClick={togglePriceSort}
            >
              {priceSortState === 'none' && "価格順: 指定なし"}
              {priceSortState === 'asc' && "価格: 低 → 高 ↑"}
              {priceSortState === 'desc' && "価格: 高 → 低 ↓"}
            </button>
            <button 
              className={`btn-sort ${dateSortState !== 'none' ? 'active' : ''}`}
              onClick={toggleDateSort}
            >
              {dateSortState === 'none' && "日付順: 指定なし"}
              {dateSortState === 'desc' && "日付: 新しい順 ↓"}
              {dateSortState === 'asc' && "日付: 古い順 ↑"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontSize: '13px', color: '#4a4a4a', fontWeight: 'bold' }}>
        📊 検索結果: <span style={{ color: '#f06292' }}>{totalItems}</span> 件 
        {totalItems > 0 && `（${startIndex + 1} 〜 ${Math.min(endIndex, totalItems)} 件目を表示）`}
      </div>

      {/* 网格布局 */}
      <div className="results">
        {displayedItems.length > 0 ? (
          displayedItems.map((item, index) => {
            const brand = item['ブランド'] || '不明';
            const subCategory = item['中分類'] || '-';
            const feature = item['特徴'] || item['商品名'] || '-';
            const status = item['状態詳細'] || item['ランク'] || 'なし';
            const boxNumber = item['箱番'] || item['商品番号'] || '-';
            
            const ourSashine = formatPrice(item['自社指値'] || item['指値2'] || item['指値']);
            const imgUrl = item['画像URL'] || 'https://via.placeholder.com/400x300?text=No+Image';

            return (
              <div 
                key={item.id || index} 
                className="item-card"
                onClick={() => setActiveModalItem(item)}
              >
                <div className="brand-badge">{brand}</div>
                <img
                  src={imgUrl}
                  alt={brand}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
                
                <div className="item-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="item-cat">{subCategory}</span>
                    <span style={{ fontSize: '11px', color: '#8e9eab', marginLeft: 'auto', fontFamily: 'monospace' }}>
                      {boxNumber}
                    </span>
                  </div>

                  <div className="item-feat" title={feature}>
                    {feature}
                  </div>

                  <div className="tags-container">
                    <span className="tag-rank">{status}</span>
                    {item['出品者'] && <span className="tag-normal">{item['出品者']}</span>}
                  </div>

                  <div className="price-list">
                    <div className="price-row">
                      <span className="label">自社指値</span>
                      <span className="val-red">{ourSashine}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="status-msg">該当する商品は見つかりませんでした。</div>
        )}
      </div>

      {/* 🎯 新增的纯粉色翻页键组件结构 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="page-btn" 
            disabled={safeCurrentPage === 1}
            onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo(0,0); }}
          >
            前のページ
          </button>
          <span className="page-info">{safeCurrentPage} / {totalPages}</span>
          <button 
            className="page-btn" 
            disabled={safeCurrentPage === totalPages}
            onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo(0,0); }}
          >
            次のページ
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {activeModalItem && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setActiveModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModalItem(null)}>×</button>
            <img 
              className="modal-img" 
              style={{ objectFit: 'contain', backgroundColor: '#fafafa' }}
              src={activeModalItem['画像URL'] || 'https://via.placeholder.com/400x300?text=No+Image'} 
              alt="画像" 
            />
            <div className="modal-title">
              {activeModalItem['特徴'] || activeModalItem['商品名'] || "無題の商品"}
            </div>
            <div className="modal-details">
              <p><b>ブランド:</b> {activeModalItem['ブランド'] || 'なし'}</p>
              <p><b>カテゴリ:</b> {activeModalItem['大分類'] || ''} &gt; {activeModalItem['中分類'] || ''}</p>
              <p><b>ランク:</b> <span style={{ color: '#f06292', fontWeight: 'bold' }}>{activeModalItem['状態詳細'] || activeModalItem['ランク'] || 'なし'}</span></p>
              <p><b>箱番/商品番号:</b> {activeModalItem['箱番'] || activeModalItem['商品番号'] || 'なし'}</p>
              <p><b>出品者:</b> {activeModalItem['出品者'] || 'なし'}</p>
              <p><b>大会開催日:</b> {activeModalItem['大会開催日'] || activeModalItem['日付'] || 'なし'}</p>
              
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #fce4ec' }}>
                <p><b>指値:</b> {formatPrice(activeModalItem['指値'])}</p>
                <p><b>自社指値:</b> <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '15px' }}>{formatPrice(activeModalItem['自社指値'] || activeModalItem['指値2'] || activeModalItem['指値'])}</span></p>
                <p><b>売価予想:</b> {formatPrice(activeModalItem['売価予想'])}</p>
              </div>

              <div style={{ marginTop: '10px', padding: '8px', background: '#fff0f5', borderRadius: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifycontent: 'space-between' }}>
                  <span>① {activeModalItem['1番手顧客'] || '-'}</span>
                  <b style={{ marginLeft: 'auto' }}>{formatPrice(activeModalItem['1番手入札'])}</b>
                </div>
                <div style={{ display: 'flex', justifycontent: 'space-between', marginTop: '4px' }}>
                  <span>② {activeModalItem['2番手顧客'] || '-'}</span>
                  <b style={{ marginLeft: 'auto' }}>{formatPrice(activeModalItem['2番手入札'])}</b>
                </div>
                <div style={{ display: 'flex', justifycontent: 'space-between', marginTop: '4px' }}>
                  <span>③ {activeModalItem['3番手顧客'] || '-'}</span>
                  <b style={{ marginLeft: 'auto' }}>{formatPrice(activeModalItem['3番手入札'])}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 嵌入样式 */}
      <style jsx global>{`
        :root { 
          --primary-color: #f48fb1; 
          --primary-hover: #f06292;
          --bg-color: #fff0f5; 
          --text-main: #4a4a4a; 
          --text-muted: #8e9eab; 
          --card-bg: #ffffff; 
          --border-color: #fce4ec; 
        }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: var(--bg-color); color: var(--text-main); margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        
        .search-panel { background: var(--card-bg); border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(244, 143, 177, 0.1); margin-bottom: 20px; border: 1px solid var(--border-color); }
        .search-row { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
        .search-group { display: flex; flex: 1; background: #fafafa; padding: 2px; border-radius: 8px; border: 1px solid var(--border-color); align-items: center; }
        input[type="text"] { flex: 1; border: none; background: transparent; padding: 10px 15px; font-size: 14px; outline: none; color: var(--text-main); }
        
        .btn-search { background-color: var(--primary-color); color: white; border: none; border-radius: 6px; padding: 8px 20px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-right: 2px; outline: none; }
        .btn-search:hover { background-color: var(--primary-hover); }

        .filter-row { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; }
        .filter-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; }
        select, input[type="date"] { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: white; outline: none; color: #4a4a4a; font-size: 13px; }
        
        .btn-sort { background: white; border: 1px solid var(--primary-color); color: var(--primary-hover); padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none; }
        .btn-sort:hover { background: var(--border-color); }
        .btn-sort.active { background: var(--primary-color); color: white; }

        .results { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .item-card { background: white; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); transition: 0.3s; padding: 10px; position: relative; cursor: pointer; display: flex; flex-direction: column; }
        .item-card:hover { box-shadow: 0 5px 15px rgba(244,143,177,0.2); transform: translateY(-2px); }
        .item-card img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; background: #fdfdfd; }
        
        .brand-badge { position: absolute; top: 15px; left: 15px; background: rgba(255, 255, 255, 0.9); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; color: var(--text-main); border: 1px solid var(--border-color); backdrop-filter: blur(4px); z-index: 10; }
        .item-info { padding: 10px 5px 5px 5px; display: flex; flex-direction: column; flex: 1; }
        .item-cat { font-size: 11px; color: var(--primary-hover); font-weight: bold; }
        .item-feat { font-size: 13px; margin: 8px 0; height: 3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.5; color: var(--text-main); }
        
        .tags-container { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; font-size: 11px; margin-top: auto; }
        .tag-rank { background: #fce4ec; color: #d81b60; padding: 3px 6px; border-radius: 4px; font-weight: bold; }
        .tag-normal { background: #f5f5f5; color: #666; padding: 3px 6px; border-radius: 4px; max-w: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        
        .price-list { margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px; }
        .price-row { display: flex; justify-content: space-between; align-items: center; }
        .label { font-size: 12px; color: var(--text-muted); }
        .val-red { color: #e74c3c; font-weight: bold; font-size: 15px; }
        .status-msg { grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px; font-weight: bold; background: white; border-radius: 12px; border: 1px solid var(--border-color); }

        .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 30px; padding-bottom: 20px; grid-column: 1 / -1; }
        .page-btn { background: white; border: 1px solid var(--primary-color); color: var(--primary-hover); padding: 8px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; outline: none; }
        .page-btn:hover:not(:disabled) { background: var(--primary-color); color: white; border-color: var(--primary-color); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; background: #fafafa; color: #999; border-color: #eee; }
        .page-info { font-size: 14px; color: var(--text-main); font-weight: bold; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; border-radius: 16px; padding: 24px; max-width: 450px; width: 90%; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid var(--border-color); max-height: 85vh; overflow-y: auto; }
        .modal-close { position: absolute; top: 15px; right: 15px; font-size: 24px; cursor: pointer; color: var(--text-muted); border: none; background: none; outline: none; padding: 0; line-height: 1; }
        .modal-img { width: 100%; height: 300px; border-radius: 12px; margin-bottom: 15px; }
        .modal-title { font-size: 15px; font-weight: bold; margin-bottom: 12px; color: var(--text-main); line-height: 1.5; }
        .modal-details { font-size: 13px; line-height: 1.8; color: #555; }
        .modal-details p { margin: 4px 0; }
      `}</style>
    </div>
  );
}
