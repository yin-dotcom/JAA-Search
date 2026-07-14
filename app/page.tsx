'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// 初始化 Supabase 客户端 (给一个合法的占位符，防止打包阶段崩溃)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索和过滤的状态控制
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // 1. 从 Supabase 获取数据并进行【智能分类纠错】
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from('jaa_items')
          .select('*');

        if (dbError) throw dbError;

        if (data) {
          // 💡 智能分类纠错器 (完美平移 Python 逻辑)
          const processedData = data.map((item: any) => {
            let subCat = String(item['中分類'] || '');
            const title = `${item['特徴'] || ''} ${item['商品名'] || ''}`;

            if (subCat.includes('その他')) {
              if (title.includes('ポーチ')) subCat = 'ポーチ';
              else if (title.includes('財布') || title.includes('ウォレット')) subCat = '財布';
              else if (title.includes('ショルダー')) subCat = 'ショルダーバッグ';
              else if (title.includes('トート')) subCat = 'トートバッグ';
              else if (title.includes('リュック') || title.includes('バックパック')) subCat = 'リュック';
              else if (title.includes('ハンドバッグ')) subCat = 'ハンドバッグ';
              else if (title.includes('ボストン')) subCat = 'ボストンバッグ';
              else if (title.includes('クラッチ')) subCat = 'クラッチバッグ';
              else if (title.includes('ネックレス') || title.includes('ペンダント')) subCat = 'ネックレス';
              else if (title.includes('ピアス') || title.includes('イヤリング')) subCat = 'ピアス・イヤリング';
              else if (title.includes('リング') || title.includes('指輪')) subCat = 'リング';
              else if (title.includes('ブレスレット') || title.includes('バングル')) subCat = 'ブレスレット・バングル';
              else if (title.includes('スカーフ') || title.includes('マフラー')) subCat = 'マフラー・ストール';
              else if (title.includes('ネクタイ')) subCat = 'ネクタイ';
              else if (title.includes('サングラス') || title.includes('メガネ')) subCat = 'メガネ・サングラス';
              else if (title.includes('ベルト')) subCat = 'ベルト';
              else if (title.includes('キーケース') || title.includes('キーホルダー')) subCat = 'キーホルダー・キーケース';
            }

            return {
              ...item,
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

    if (supabaseUrl && supabaseAnonKey) {
      fetchData();
    } else {
      setError('Supabaseの認証キーが設定されていません。.env.local を確認してください。');
      setLoading(false);
    }
  }, []);

  // 2. 辅助函数：格式化日元价格
  const formatPrice = (val: any) => {
    if (!val) return '-';
    const cleanVal = String(val).replace('¥', '').replace(/,/g, '').trim();
    const num = parseFloat(cleanVal);
    return !isNaN(num) ? `¥${Math.floor(num).toLocaleString()}` : '-';
  };

  // 获取所有非空分类，供筛选下拉框使用
  const categories = ['ALL', ...Array.from(new Set(items.map(i => i['中分類']).filter(Boolean))).sort()];

  // 3. 核心过滤逻辑 (支持搜索、分类筛选、状态模糊匹配)
  const filteredItems = items.filter(item => {
    // 搜索过滤: 支持跨字段检索（箱番、ブランド、特徴、出品者等全部转为字符串匹配）
    const searchString = `${item['ブランド']} ${item['特徴']} ${item['中分類']} ${item['箱番']} ${item['商品番号']} ${item['出品者']}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    // 分类过滤
    const matchesCategory = selectedCategory === 'ALL' || item['中分類'] === selectedCategory;

    // 状态过滤 (模糊包含匹配)
    const itemStatus = String(item['状態詳細'] || '');
    const matchesStatus = selectedStatus === 'ALL' || itemStatus.toLowerCase().includes(selectedStatus.toLowerCase());

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 获取要展示的页面上限数据
  const displayedItems = filteredItems.slice(0, itemsPerPage);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-red-100 text-center">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">エラーが発生しました</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      {/* 标题 */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 flex items-center gap-2">
          <span>🔍</span> 内部商品検索システム
        </h1>
      </header>

      {/* 搜索 & 过滤工具栏 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        {/* 搜索框 */}
        <div className="lg:col-span-6">
          <label className="block text-xs font-semibold text-gray-500 mb-1">検索:</label>
          <input
            type="text"
            placeholder="特徴、型番、ブランド、箱番などを入力..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {/* 中分类选择 */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">中分類:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {/* 状态选择 */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">状態:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {["ALL", "N", "S", "SA", "A", "AB", "B", "BC", "C"].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        {/* 显示件数 */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">表示件数:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[50, 100, 500, 1000].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 数据量状态统计 */}
      <div className="mb-4 text-sm text-gray-600 font-medium">
        📊 検索結果: <span className="text-blue-600 font-bold">{filteredItems.length}</span> 件
      </div>

      {/* 卡片展示区 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {displayedItems.length > 0 ? (
          displayedItems.map((item, index) => {
            const brand = item['ブランド'] || '不明';
            const category = item['中分類'] || '-';
            const feature = item['特徴'] || '-';
            const status = item['状態詳細'] || '-';
            const seller = item['出品者'] || '-';
            
            // 读取「箱番」或「商品番号」
            const boxNumber = item['箱番'] || item['商品番号'] || '-'; 

            // 各价格格式化
            const sashine = formatPrice(item['指値']);
            const ourSashine = formatPrice(item['自社指値'] || item['指値2']); // 兼容指値2
            const sellPrice = formatPrice(item['売価予想']);

            // 1/2/3手出价信息
            const c1Name = item['1番手顧客'] || '-';
            const c1Bid = formatPrice(item['1番手入札']);
            const c2Name = item['2番手顧客'] || '-';
            const c2Bid = formatPrice(item['2番手入札']);
            const c3Name = item['3番手顧客'] || '-';
            const c3Bid = formatPrice(item['3番手入札']);

            // 图片获取逻辑 (已拿掉商品URL，只认画像URL)
            const imgUrl = item['画像URL'] || 'https://via.placeholder.com/400x300?text=No+Image';

            return (
              <div 
                key={item.id || index} 
                className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:translate-y-[-3px] hover:border-blue-500 hover:shadow-md"
              >
                {/* 品牌悬浮标签 */}
                <div className="absolute left-3 top-3 z-10 rounded bg-gray-900/90 px-2 py-1 text-xs font-bold text-white backdrop-blur-[2px]">
                  {brand}
                </div>

                {/* 商品图片区 */}
                <div className="relative h-48 w-full bg-gray-100">
                  <img
                    src={imgUrl}
                    alt={brand}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>

                {/* 卡片详细内容区 */}
                <div className="flex flex-1 flex-col p-4">
                  {/* 分类和箱番并排展示 */}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-600">{category}</span>
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {boxNumber}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 h-8" title={feature}>
                    {feature}
                  </div>

                  {/* 信息列表（元数据） */}
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-xs space-y-1.5 mt-auto">
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-1.5">
                      <span className="text-gray-400">出品者</span>
                      <span className="font-semibold text-gray-700 max-w-[65%] truncate">{seller}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-1.5">
                      <span className="text-gray-400">状態</span>
                      <span className="font-semibold text-gray-700">{status}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-1.5">
                      <span className="text-gray-400">指値</span>
                      <span className="font-semibold text-gray-700">{sashine}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-gray-100 pb-1.5">
                      <span className="text-gray-400">自社指値</span>
                      <span className="font-extrabold text-red-500 text-sm">{ourSashine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">売価予想</span>
                      <span className="font-semibold text-gray-700">{sellPrice}</span>
                    </div>
                  </div>

                  {/* 出价详情版块 */}
                  <div className="mt-2.5 rounded-lg bg-blue-50/40 p-2.5 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">① {c1Name}</span>
                      <span className="font-bold text-gray-800">{c1Bid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">② {c2Name}</span>
                      <span className="font-bold text-gray-800">{c2Bid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">③ {c3Name}</span>
                      <span className="font-bold text-gray-800">{c3Bid}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white border border-gray-200 rounded-2xl">
            <p className="text-gray-500 text-base">該当する商品は見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* 分页溢出提示 */}
      {filteredItems.length > itemsPerPage && (
        <div className="mt-8 text-center text-sm text-gray-400 font-medium">
          ⚠️ 表示上限（{itemsPerPage}件）に達しました。検索条件を絞るか、表示件数を変更してください。
        </div>
      )}
    </main>
  );
}
