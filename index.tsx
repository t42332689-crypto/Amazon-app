
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  Search, ShoppingCart, MapPin, Menu, ChevronRight, Star, ChevronLeft, X,
  Plus, Minus, ArrowLeft, Check, Edit, Trash2, Settings, Image as ImageIcon,
  Save, LogOut, User, ThumbsUp, Layout, Globe, Info, Loader2, ChevronUp
} from 'lucide-react';

// --- Supabase Initialization ---
const SUPABASE_URL = 'https://pegivrgrdumkpkcesddx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2nUcEQDMsbM0F9EsJCdfAg_dzLuVzHr';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Types ---
interface Review {
  id: number;
  product_id?: number;
  user_name: string;
  rating: number;
  date: string;
  comment: string;
  images: string[];
  verified: boolean;
}

interface Product {
  id: number;
  title: string;
  price: number;
  rating: number;
  reviews_count: number;
  images: string[];
  category: string;
  description: string;
  brand_info: string;
  product_info: string;
  features: string; 
  buy_now_url?: string;
  customerReviews?: Review[];
}

interface CategoryCard {
  id: number;
  title: string;
  items: { label: string; image: string }[];
}

// --- Constants ---
const INITIAL_HEROES = [
  "https://m.media-amazon.com/images/I/71Ie3JXGfVL._SX3000_.jpg",
  "https://m.media-amazon.com/images/I/61zAjw4bqPL._SX3000_.jpg",
  "https://m.media-amazon.com/images/I/81KkrQWEHIL._SX3000_.jpg"
];

// --- Shared Utils ---
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
};

// --- Components ---

const Header = ({ cartCount, onSearch, setView, searchTerm, onLoginTrigger }: any) => (
  <header className="bg-[#131921] text-white sticky top-0 z-50">
    <div className="flex items-center px-4 py-2 gap-4">
      <div className="flex items-center cursor-pointer border border-transparent hover:border-white p-1" onClick={() => { setView('home'); onSearch(''); }}>
        <img src="https://pngimg.com/uploads/amazon/amazon_PNG11.png" alt="Amazon" className="h-8 mt-2" />
      </div>

      <div className="hidden md:flex items-center gap-1 border border-transparent hover:border-white p-2 cursor-pointer" onClick={onLoginTrigger}>
        <MapPin size={18} className="mt-2" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 leading-tight">Deliver to</span>
          <span className="text-sm font-bold leading-tight">United States</span>
        </div>
      </div>

      <div className="flex-1 flex h-10 group">
        <input 
          type="text" 
          className="flex-1 px-3 text-black focus:outline-none rounded-l-md"
          placeholder="Search Amazon"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
        <div className="bg-[#febd69] hover:bg-[#f3a847] flex items-center justify-center px-4 rounded-r-md cursor-pointer text-black">
          <Search size={22} strokeWidth={3} />
        </div>
      </div>

      <div className="hidden md:flex flex-col border border-transparent hover:border-white p-2 cursor-pointer leading-tight" onClick={onLoginTrigger}>
        <span className="text-xs">Hello, sign in</span>
        <span className="text-sm font-bold flex items-center">Account & Lists <ChevronRight size={14} className="rotate-90 ml-1" /></span>
      </div>

      <div className="flex items-center gap-1 border border-transparent hover:border-white p-2 cursor-pointer relative" onClick={() => setView('cart')}>
        <div className="relative">
          <ShoppingCart size={32} />
          <span className="absolute top-[-2px] left-[15px] text-[#f08804] rounded-full w-5 h-5 flex items-center justify-center font-bold text-base">{cartCount}</span>
        </div>
        <span className="text-sm font-bold mt-3 hidden sm:block">Cart</span>
      </div>
    </div>
    <div className="bg-[#232f3e] flex items-center px-4 py-1 gap-4 text-sm font-medium overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 cursor-pointer border border-transparent hover:border-white p-1"><Menu size={20} /><span>All</span></div>
      {['Today\'s Deals', 'Customer Service', 'Registry', 'Gift Cards', 'Sell'].map(item => (
        <div key={item} className="cursor-pointer border border-transparent hover:border-white p-1 whitespace-nowrap">{item}</div>
      ))}
    </div>
  </header>
);

const ImageZoom = ({ src }: { src: string }) => {
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, visible: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y, visible: true });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square bg-white border border-gray-100 rounded-lg overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZoomPos(p => ({ ...p, visible: false }))}
    >
      <img 
        src={src} 
        alt="Product" 
        className={`w-full h-full object-contain transition-transform duration-200 ${zoomPos.visible ? 'scale-[2.5]' : 'scale-100'}`}
        style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
      />
    </div>
  );
};

const ProductDetail = ({ product, allProducts, addToCart, goBack, onProductSelect }: any) => {
  const [activeImage, setActiveImage] = useState(product.images?.[0] || '');
  
  const averageRating = useMemo(() => {
    if (!product.customerReviews || product.customerReviews.length === 0) return product.rating || 4.5;
    return product.customerReviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / product.customerReviews.length;
  }, [product.customerReviews, product.rating]);

  return (
    <div className="bg-white min-h-screen text-[#0f1111]">
      <div className="max-w-[1500px] mx-auto p-4 md:p-8">
        <button onClick={goBack} className="flex items-center gap-1 text-sm text-[#007185] hover:text-[#c45500] hover:underline mb-6 font-medium">
          <ArrowLeft size={16} /> Back to results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 flex flex-col md:flex-row gap-4">
            <div className="flex flex-row md:flex-col gap-2 order-2 md:order-1 overflow-x-auto no-scrollbar">
              {product.images?.map((img: string, i: number) => (
                <div key={i} onMouseEnter={() => setActiveImage(img)} className={`w-12 h-12 border-2 rounded-md overflow-hidden cursor-pointer flex-shrink-0 ${activeImage === img ? 'border-[#e77600]' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-contain p-0.5" onError={handleImageError} />
                </div>
              ))}
            </div>
            <div className="flex-1 order-1 md:order-2">
              <ImageZoom src={activeImage} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h1 className="text-2xl font-medium text-[#0f1111] leading-tight">{product.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0f1111]">{averageRating.toFixed(1)}</span>
              <div className="flex text-[#ffa41c]">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.floor(averageRating) ? "currentColor" : "none"} strokeWidth={1} />)}
              </div>
              <span className="text-sm text-[#007185] cursor-pointer hover:underline">{product.customerReviews?.length || 0} ratings</span>
            </div>
            <div className="border-y py-3">
              <div className="flex items-start gap-1 text-[#0f1111]">
                <span className="text-sm mt-1">$</span>
                <span className="text-3xl font-medium">{Number(product.price).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-[#0f1111]">About this item</h3>
              <ul className="list-disc ml-5 text-sm space-y-1 text-[#0f1111] whitespace-pre-wrap">
                {product.features?.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg p-5 space-y-4 shadow-sm h-fit sticky top-24 bg-white">
              <div className="flex items-start text-[#0f1111]">
                <span className="text-sm mt-1">$</span>
                <span className="text-3xl font-medium">{Number(product.price).toFixed(2)}</span>
              </div>
              <p className="text-sm text-[#007600] font-bold">In Stock</p>
              <div className="space-y-2">
                <button onClick={() => addToCart(product)} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black rounded-full py-2.5 font-medium text-sm shadow-sm border border-[#fcd200]">Add to Cart</button>
                <button onClick={() => product.buy_now_url ? window.open(product.buy_now_url, '_blank') : alert('Redirect URL not set')} className="w-full bg-[#ffa41c] hover:bg-[#fa8900] text-black rounded-full py-2.5 font-medium text-sm shadow-sm border border-[#ca8114]">Buy Now</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
           <h2 className="text-xl font-bold mb-4 text-[#0f1111]">Product information</h2>
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                 <h4 className="font-bold text-sm mb-3 text-[#0f1111] uppercase tracking-widest border-b pb-1">Brand Information</h4>
                 <div className="text-sm whitespace-pre-wrap leading-relaxed text-[#0f1111]">{product.brand_info}</div>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                 <h4 className="font-bold text-sm mb-3 text-[#0f1111] uppercase tracking-widest border-b pb-1">Technical Details</h4>
                 <div className="text-sm whitespace-pre-wrap leading-relaxed text-[#0f1111]">{product.product_info}</div>
              </div>
           </div>
        </div>

        <div className="mt-12 border-t pt-8">
           <h2 className="text-xl font-bold mb-4 text-[#0f1111]">Product Description</h2>
           <div className="text-sm whitespace-pre-wrap leading-relaxed max-w-4xl text-[#0f1111]">{product.description}</div>
        </div>

        <div className="mt-12 border-t pt-8 grid lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4">
              <h2 className="text-xl font-bold mb-2 text-[#0f1111]">Customer reviews</h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-[#ffa41c]">
                  {[...Array(5)].map((_, i) => <Star key={i} size={22} fill={i < Math.floor(averageRating) ? "currentColor" : "none"} strokeWidth={1} />)}
                </div>
                <span className="font-bold text-lg text-[#0f1111]">{averageRating.toFixed(1)} out of 5</span>
              </div>
           </div>
           <div className="lg:col-span-8 space-y-8">
              <h3 className="text-lg font-bold text-[#0f1111]">Top reviews from the United States</h3>
              {!product.customerReviews || product.customerReviews.length === 0 ? <p className="text-gray-500 italic">No reviews yet.</p> : product.customerReviews.map((review: any) => (
                <div key={review.id} className="space-y-2 border-b pb-8 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 rounded-full p-2"><User size={20} className="text-gray-500" /></div>
                    <span className="text-sm font-medium text-[#0f1111]">{review.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-[#ffa41c]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1} />)}
                    </div>
                    <span className="text-sm font-bold text-[#c45500]">Verified Purchase</span>
                  </div>
                  <p className="text-xs text-gray-500">{review.date}</p>
                  <p className="text-sm leading-relaxed text-[#0f1111] whitespace-pre-wrap">{review.comment}</p>
                  <div className="flex gap-2 flex-wrap">
                    {review.images?.filter(Boolean).map((img: string, i: number) => (
                      <img key={i} src={img} className="w-24 h-24 object-cover rounded border" onError={handleImageError} />
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ 
  products, onSaveProduct, onDeleteProduct, onLogout, 
  heroes, onSaveHeroes, categories, onSaveCategories 
}: any) => {
  const [activeTab, setActiveTab] = useState<'products' | 'home'>('products');
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const saveProduct = (p: any) => {
    onSaveProduct(p);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="bg-[#232f3e] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}><Settings size={22} /> Amazon Store Admin</h1>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('products')} className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white text-black' : 'hover:bg-white/10'}`}>Products</button>
            <button onClick={() => setActiveTab('home')} className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-white text-black' : 'hover:bg-white/10'}`}>Home Assets</button>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1 text-sm font-bold text-red-400 hover:text-red-300"><LogOut size={18} /> Logout</button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 text-[#0f1111]">
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
              <button onClick={() => setEditingProduct({ id: 0, title: '', price: 0, images: [''], description: '', features: '', brand_info: '', product_info: '', buy_now_url: '', customerReviews: [] })} className="bg-[#f0c14b] px-6 py-2 rounded-lg font-bold border border-[#a88734] hover:bg-[#e2b13c] shadow-sm">+ Create New Product</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b bg-gray-50"><th className="p-4 text-xs font-bold text-gray-500 uppercase">Thumbnail</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Title</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Price</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th></tr></thead>
                <tbody>
                  {products.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors text-[#0f1111]">
                      <td className="p-4"><img src={p.images?.[0] || ''} className="w-12 h-12 object-contain bg-white border p-1 rounded" onError={handleImageError} /></td>
                      <td className="p-4 font-medium text-gray-800 line-clamp-1">{p.title}</td>
                      <td className="p-4 font-bold text-green-700">${Number(p.price).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingProduct({...p})} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="text-blue-500" /> Hero Marketing Banners</h3>
               <div className="grid md:grid-cols-2 gap-6">
                  {heroes.map((url: string, i: number) => (
                    <div key={i} className="space-y-2 group">
                       <div className="aspect-[21/9] bg-gray-100 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all">
                         <img src={url} className="w-full h-full object-cover" onError={handleImageError} />
                       </div>
                       <input className="w-full p-2 border rounded-lg text-xs font-mono bg-gray-50" value={url} onChange={e => {
                         const h = [...heroes]; h[i] = e.target.value; onSaveHeroes(h);
                       }} placeholder="Hero Banner URL" />
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Layout className="text-orange-500" /> Home Category Cards</h3>
               {categories.map((cat: any, i: number) => (
                 <div key={i} className="mb-10 border-b pb-8 last:border-0 last:pb-0">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Card Title</label>
                    <input className="font-bold text-xl mb-6 w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none text-[#0f1111]" value={cat.title} onChange={e => {
                      const c = [...categories]; c[i].title = e.target.value; onSaveCategories(c);
                    }} />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                       {cat.items.map((item: any, j: number) => (
                         <div key={j} className="space-y-3 bg-gray-50 p-3 rounded-xl border">
                            <div className="h-24 flex items-center justify-center bg-white rounded-lg p-2">
                              <img src={item.image} className="max-h-full object-contain" onError={handleImageError} />
                            </div>
                            <input className="text-xs font-bold w-full p-2 border rounded text-[#0f1111]" value={item.label} onChange={e => {
                              const c = [...categories]; c[i].items[j].label = e.target.value; onSaveCategories(c);
                            }} placeholder="Item Label" />
                            <input className="text-[10px] w-full p-2 border rounded bg-white text-[#0f1111]" value={item.image} onChange={e => {
                              const c = [...categories]; c[i].items[j].image = e.target.value; onSaveCategories(c);
                            }} placeholder="Image URL" />
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white py-3 border-b z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-[#f0c14b] p-2 rounded-lg"><Edit size={24} /></div>
                  <h3 className="text-2xl font-bold text-gray-800">{editingProduct.id === 0 ? 'Add New Product' : 'Advanced Product Editor'}</h3>
                </div>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={32} /></button>
              </div>

              <div className="grid md:grid-cols-12 gap-10">
                 <div className="md:col-span-7 space-y-6">
                    <section className="space-y-4">
                      <h4 className="font-black text-xs text-gray-400 uppercase tracking-widest border-b pb-2">Basic Info</h4>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Product Title</label>
                        <input className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all text-[#0f1111]" value={editingProduct.title} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                          <input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Buy Now Redirect URL</label>
                          <input className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.buy_now_url} onChange={e => setEditingProduct({...editingProduct, buy_now_url: e.target.value})} placeholder="https://..." />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="font-black text-xs text-gray-400 uppercase tracking-widest border-b pb-2">Image Assets (Newline separated)</h4>
                      <textarea className="w-full p-3 border-2 border-gray-100 rounded-xl h-32 font-mono text-xs focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.images?.join('\n')} onChange={e => setEditingProduct({...editingProduct, images: e.target.value.split('\n')})} />
                    </section>

                    <section className="space-y-4">
                      <h4 className="font-black text-xs text-gray-400 uppercase tracking-widest border-b pb-2">Specifications & Features</h4>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">About this item</label>
                        <textarea className="w-full p-3 border-2 border-gray-100 rounded-xl h-40 focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.features} onChange={e => setEditingProduct({...editingProduct, features: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Brand Information</label>
                          <textarea className="w-full p-3 border-2 border-gray-100 rounded-xl h-24 focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.brand_info} onChange={e => setEditingProduct({...editingProduct, brand_info: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Product Information</label>
                          <textarea className="w-full p-3 border-2 border-gray-100 rounded-xl h-24 focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.product_info} onChange={e => setEditingProduct({...editingProduct, product_info: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Description</label>
                        <textarea className="w-full p-3 border-2 border-gray-100 rounded-xl h-40 focus:border-blue-500 outline-none text-[#0f1111]" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                      </div>
                    </section>
                 </div>

                 <div className="md:col-span-5 space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 h-full">
                       <div className="flex justify-between items-center mb-6 border-b pb-4">
                          <h4 className="font-black text-xs text-gray-400 uppercase tracking-widest">Customer Reviews</h4>
                          <button onClick={() => {
                            const r = { id: 0, user_name: 'Amazon Customer', rating: 5, date: new Date().toLocaleDateString(), comment: '', images: [], verified: true };
                            setEditingProduct({...editingProduct, customerReviews: [...(editingProduct.customerReviews || []), r]});
                          }} className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-blue-700">+ Add Review</button>
                       </div>
                       
                       <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-2">
                          {editingProduct.customerReviews?.map((rev: any, idx: number) => (
                            <div key={rev.id || idx} className="bg-white p-4 rounded-xl border-2 border-gray-100 relative shadow-sm text-[#0f1111]">
                               <button onClick={() => {
                                 const rs = editingProduct.customerReviews.filter((_: any, i: number) => i !== idx);
                                 setEditingProduct({...editingProduct, customerReviews: rs});
                               }} className="absolute top-3 right-3 text-red-400 bg-red-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                               <div className="space-y-3">
                                 <input className="w-full p-2 border-b text-sm font-bold bg-transparent outline-none text-[#0f1111]" value={rev.user_name} onChange={e => {
                                   const rs = [...editingProduct.customerReviews]; rs[idx].user_name = e.target.value; setEditingProduct({...editingProduct, customerReviews: rs});
                                 }} placeholder="User Name" />
                                 <textarea className="w-full p-2 text-xs border bg-gray-50 h-20 rounded outline-none text-[#0f1111]" value={rev.comment} onChange={e => {
                                   const rs = [...editingProduct.customerReviews]; rs[idx].comment = e.target.value; setEditingProduct({...editingProduct, customerReviews: rs});
                                 }} placeholder="Review Comment..." />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mt-10 pt-8 border-t">
                <button onClick={() => saveProduct(editingProduct)} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95"><Save size={24} /> Save Product to Store</button>
                <button onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginView = ({ onLogin, onCancel }: { onLogin: (u: string, p: string) => void; onCancel: () => void; }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-20">
      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="h-10 mb-12 cursor-pointer" onClick={onCancel} />
      <div className="w-[380px] border border-gray-300 rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-medium mb-6 text-[#0f1111]">Admin Sign in</h1>
        <form onSubmit={e => { e.preventDefault(); onLogin(u, p); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Username</label>
            <input className="w-full border-2 border-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-[#0f1111]" value={u} onChange={e => setU(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Password</label>
            <input type="password" className="w-full border-2 border-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-[#0f1111]" value={p} onChange={e => setP(e.target.value)} required />
          </div>
          <button className="w-full bg-[#f0c14b] py-3 rounded-lg font-bold border border-[#a88734] shadow-md hover:bg-[#e2b13c] transition-colors active:scale-95">Enter Admin Mode</button>
        </form>
        <button onClick={onCancel} className="w-full mt-6 text-sm text-blue-600 hover:text-orange-600 font-medium">Return to Shop</button>
      </div>
    </div>
  );
};

const Footer = ({ setView }: any) => (
  <footer className="mt-auto">
    <button 
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="w-full bg-[#37475a] hover:bg-[#485769] text-white py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2"
    >
      <ChevronUp size={16} /> Back to top
    </button>
    <div className="bg-[#232f3e] text-white py-12">
      <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 px-6">
        <div className="space-y-3">
          <h4 className="font-bold text-base">Get to Know Us</h4>
          <ul className="text-sm text-gray-300 space-y-2 cursor-pointer">
            <li className="hover:underline">Careers</li>
            <li className="hover:underline">Blog</li>
            <li className="hover:underline">About Amazon</li>
            <li className="hover:underline">Sustainability</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-base">Make Money with Us</h4>
          <ul className="text-sm text-gray-300 space-y-2 cursor-pointer">
            <li className="hover:underline">Sell on Amazon</li>
            <li className="hover:underline">Sell Apps</li>
            <li className="hover:underline">Affiliate Program</li>
            <li className="hover:underline">Self-Publish with Us</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-base">Amazon Payment</h4>
          <ul className="text-sm text-gray-300 space-y-2 cursor-pointer">
            <li className="hover:underline">Amazon Business Card</li>
            <li className="hover:underline">Shop with Points</li>
            <li className="hover:underline">Reload Your Balance</li>
            <li className="hover:underline">Amazon Currency Converter</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-base">Let Us Help You</h4>
          <ul className="text-sm text-gray-300 space-y-2 cursor-pointer">
            <li className="hover:underline">Your Account</li>
            <li className="hover:underline">Your Orders</li>
            <li className="hover:underline">Shipping Rates & Policies</li>
            <li className="hover:underline">Returns & Replacements</li>
          </ul>
        </div>
      </div>
      <div className="mt-16 pt-12 border-t border-gray-700 text-center px-4">
        <img src="https://pngimg.com/uploads/amazon/amazon_PNG11.png" className="h-8 mx-auto mb-6 opacity-80 cursor-pointer" onClick={() => setView('home')} />
        <p className="text-xs text-gray-400">© 1996-2024, Amazon Clone Inc. This site is for educational purposes.</p>
      </div>
    </div>
  </footer>
);

// --- Main App ---

export default function AmazonClone() {
  const [view, setView] = useState<'home' | 'detail' | 'cart' | 'login' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [heroes, setHeroes] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryCard[]>([]);

  const cartCount = cart.reduce((a, b) => a + (b.quantity || 1), 0);
  const cartSubtotal = cart.reduce((a, b) => a + Number(b.price), 0);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase.from('products').select('*, reviews(*)').order('id', { ascending: false });
      if (pError) throw pError;
      
      const formattedProducts = pData.map((p: any) => ({
        ...p,
        customerReviews: p.reviews
      }));
      setProducts(formattedProducts);

      const { data: cData, error: cError } = await supabase.from('site_config').select('*');
      if (cError) throw cError;

      const heroesObj = cData.find(d => d.key === 'heroes');
      const catsObj = cData.find(d => d.key === 'categories');
      
      if (heroesObj) setHeroes(heroesObj.value);
      if (catsObj) setCategories(catsObj.value);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onProductSelect = (p: Product) => { setSelectedProduct(p); setView('detail'); window.scrollTo(0,0); };

  const onSaveProduct = async (p: any) => {
    // Crucial: Separate ID and reviews from the main object to save
    const { id, customerReviews, reviews, ...productData } = p;
    
    let productId = id;
    
    if (id !== 0) {
      // Update existing
      const { error: updateError } = await supabase.from('products').update(productData).eq('id', id);
      if (updateError) {
          console.error("Update Error:", updateError);
          alert("Error updating product");
          return;
      }
    } else {
      // Create new - SUPABASE WILL GENERATE THE ID
      const { data: insertData, error: insertError } = await supabase.from('products').insert([productData]).select();
      if (insertError) {
          console.error("Insert Error:", insertError);
          alert("Error creating product");
          return;
      }
      productId = insertData[0].id;
    }

    // Save Reviews if any
    if (productId && customerReviews) {
        // Simple strategy: replace all reviews for this product
        await supabase.from('reviews').delete().eq('product_id', productId);
        const reviewsToInsert = customerReviews.map((r: any) => ({
            product_id: productId,
            user_name: r.user_name || 'Amazon Customer',
            rating: Number(r.rating) || 5,
            comment: r.comment || '',
            date: r.date || new Date().toLocaleDateString(),
            images: r.images || []
        })).filter((r: any) => r.comment.trim() !== '');
        
        if (reviewsToInsert.length > 0) {
            await supabase.from('reviews').insert(reviewsToInsert);
        }
    }

    // Final refresh
    await fetchData();
  };

  const onDeleteProduct = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            console.error("Delete error:", error);
            alert("Could not delete product");
        }
        fetchData();
    }
  };

  const onSaveHeroes = async (h: string[]) => {
    setHeroes(h);
    await supabase.from('site_config').upsert({ key: 'heroes', value: h });
  };

  const onSaveCategories = async (c: CategoryCard[]) => {
    setCategories(c);
    await supabase.from('site_config').upsert({ key: 'categories', value: c });
  };

  const handleLogin = (u: string, p: string) => {
    if (u === '@Amazon project' && p === '@Amazon project123') setView('admin');
    else alert("Invalid Username or Password!");
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    const confirmCheckout = window.confirm(`Proceed to checkout with ${cart.length} items for a total of $${cartSubtotal.toFixed(2)}?`);
    if (confirmCheckout) {
        if (cart[0].buy_now_url) {
            window.open(cart[0].buy_now_url, '_blank');
        } else {
            alert('Checkout successful!');
            setCart([]);
            setView('home');
        }
    }
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && view === 'home' && products.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#eaeded]">
            <Loader2 className="animate-spin text-[#232f3e] mb-4" size={48} />
            <p className="font-bold text-[#232f3e]">Loading Amazon Store...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#0f1111]">
      {view !== 'login' && view !== 'admin' && (
        <Header cartCount={cartCount} onSearch={setSearchTerm} setView={setView} searchTerm={searchTerm} onLoginTrigger={() => setView('login')} />
      )}

      <main className="flex-1 bg-[#eaeded]">
        {view === 'login' && <LoginView onLogin={handleLogin} onCancel={() => setView('home')} />}
        
        {view === 'admin' && (
          <AdminPanel 
            products={products} onSaveProduct={onSaveProduct} onDeleteProduct={onDeleteProduct} 
            onLogout={() => setView('home')} heroes={heroes} onSaveHeroes={onSaveHeroes} categories={categories} onSaveCategories={onSaveCategories} 
          />
        )}

        {view === 'home' && (
          <div className="pb-12">
            <div className="relative h-[250px] md:h-[600px] overflow-hidden">
               <img src={heroes[0] || INITIAL_HEROES[0]} className="w-full h-full object-cover" onError={handleImageError} />
               <div className="absolute inset-0 hero-gradient"></div>
            </div>
            
            <div className="max-w-[1500px] mx-auto px-4 mt-[-100px] md:mt-[-350px] relative z-10 space-y-6">
               {/* Categories Section */}
               <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-5 flex flex-col h-full shadow-lg rounded-sm">
                      <h2 className="text-xl font-bold mb-4 text-[#0f1111]">{cat.title}</h2>
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        {cat.items.map((item, i) => (
                          <div key={i} className="flex flex-col cursor-pointer group">
                            <div className="h-28 flex items-center justify-center overflow-hidden mb-1">
                              <img src={item.image} alt={item.label} className="max-h-full object-contain group-hover:scale-105 transition-transform" onError={handleImageError} />
                            </div>
                            <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <a href="#" className="text-xs text-[#007185] hover:text-[#c45500] hover:underline mt-4 font-medium">See more</a>
                    </div>
                  ))}
               </div>

               {/* Products Section */}
               <div className="bg-white p-6 shadow-lg rounded-sm min-h-[400px]">
                  <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-[#0f1111]">Featured Products</h2>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full py-24 text-center">
                          <p className="text-gray-500 text-lg mb-4">No products available yet.</p>
                          <button onClick={() => setView('login')} className="bg-[#ffd814] px-6 py-2 rounded-lg font-medium border border-[#fcd200]">Add your first product</button>
                      </div>
                    ) : (
                      filteredProducts.map(p => (
                        <div key={p.id} className="cursor-pointer hover:shadow-xl transition-all border p-4 rounded-sm bg-white flex flex-col group" onClick={() => onProductSelect(p)}>
                           <div className="h-48 w-full flex items-center justify-center mb-4 p-2 overflow-hidden">
                            <img src={p.images?.[0] || ''} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" onError={handleImageError} />
                           </div>
                           <h3 className="text-sm font-medium line-clamp-2 mb-2 leading-snug h-10 text-[#007185] group-hover:text-[#c45500] group-hover:underline">{p.title}</h3>
                           <div className="flex text-[#ffa41c] mb-1 items-center">
                             {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(p.rating || 4.5) ? "currentColor" : "none"} />)}
                             <span className="text-xs text-blue-600 ml-2 font-medium">{p.customerReviews?.length || 0}</span>
                           </div>
                           <div className="mt-auto pt-2">
                            <div className="flex items-start">
                                <span className="text-xs font-bold mt-1">$</span>
                                <p className="text-2xl font-bold text-[#0f1111] tracking-tight ml-0.5">
                                  {Math.floor(Number(p.price))}
                                  <span className="text-xs align-top">{(Number(p.price) % 1).toFixed(2).substring(2)}</span>
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">FREE delivery <span className="font-bold">Tomorrow</span></p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {view === 'detail' && selectedProduct && (
          <ProductDetail 
            product={selectedProduct} allProducts={products} 
            addToCart={(p: Product) => setCart(c => [...c, {...p, quantity: 1}])} 
            goBack={() => setView('home')} onProductSelect={onProductSelect} 
          />
        )}

        {view === 'cart' && (
          <div className="min-h-[80vh] p-4 md:p-8 text-[#0f1111]">
            <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="lg:col-span-3 bg-white p-6 rounded shadow-sm border">
                <h1 className="text-2xl font-bold border-b pb-4 mb-4">Shopping Cart</h1>
                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <p className="text-2xl text-gray-400 font-medium">Your Amazon Cart is empty.</p>
                    <button onClick={() => setView('home')} className="bg-[#f0c14b] px-8 py-2 rounded-lg font-bold border border-[#a88734]">Shop today's deals</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-6 border-b pb-6 last:border-0 text-[#0f1111]">
                        <div className="w-44 h-44 flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={() => onProductSelect(item)}>
                          <img src={item.images?.[0] || ''} className="max-h-full max-w-full object-contain" onError={handleImageError} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="text-lg font-medium text-[#0f1111] hover:text-[#c45500] hover:underline cursor-pointer" onClick={() => onProductSelect(item)}>{item.title}</h3>
                          <p className="text-xs text-[#007600] font-bold">In Stock</p>
                          <div className="flex items-center gap-4 mt-3">
                            <button onClick={() => setCart(c => c.filter((_, i) => i !== idx))} className="text-xs text-[#007185] hover:underline">Delete</button>
                          </div>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-lg">${Number(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="bg-white p-5 rounded shadow-sm border space-y-4 sticky top-24">
                  <div className="text-lg font-medium leading-snug">
                    Subtotal ({cart.length} items): <span className="font-bold">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleProceedToCheckout}
                    className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] rounded-lg py-2 font-medium text-sm border border-[#fcd200] shadow-sm"
                  >
                    Proceed to checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {view !== 'login' && view !== 'admin' && <Footer setView={setView} />}
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<AmazonClone />);
