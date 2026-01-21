
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, ShoppingCart, MapPin, Menu, ChevronRight, Star, ChevronLeft, X,
  Plus, Minus, ArrowLeft, Check, Edit, Trash2, Settings, Image as ImageIcon,
  Save, LogOut, User, ThumbsUp, Layout, Globe, Info, Loader2, ChevronUp, ChevronDown,
  ShieldCheck, Truck, Lock, RotateCcw, MessageSquare, ExternalLink, HelpCircle,
  Tag, Gift, Award
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

// --- Shared Utils ---
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src.includes('placehold.co')) return;
  target.src = "https://placehold.co/600x400?text=Image+Not+Found";
};

const formatNumber = (num: number) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

const getDeliveryDate = (days: number) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return "soon";
  }
};

// --- Sub-components ---

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => {
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? Math.min(Math.max(rating, 0), 5) : 0;
  return (
    <div className="flex text-[#ffa41c]">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={size} 
          fill={i < Math.floor(safeRating) ? "currentColor" : "none"} 
          strokeWidth={i < Math.floor(safeRating) ? 0 : 1}
        />
      ))}
    </div>
  );
};

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
      className="relative w-full aspect-square bg-white overflow-hidden cursor-crosshair border border-transparent"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZoomPos(p => ({ ...p, visible: false }))}
    >
      <img 
        src={src || "https://placehold.co/600x400?text=No+Image"} 
        alt="Product" 
        className={`w-full h-full object-contain transition-transform duration-100 ${zoomPos.visible ? 'scale-[2.8]' : 'scale-100'}`}
        style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
      />
    </div>
  );
};

// --- Main Components ---

const Header = ({ cartCount, onSearch, navigateTo, searchTerm, goHome }: any) => (
  <header className="bg-[#131921] text-white sticky top-0 z-50">
    <div className="flex items-center px-4 py-2 gap-4">
      <div className="flex items-center cursor-pointer border border-transparent hover:border-white p-1" onClick={goHome}>
        <img src="https://pngimg.com/uploads/amazon/amazon_PNG11.png" alt="Amazon" className="h-8 mt-2" />
      </div>

      <div className="hidden md:flex items-center gap-1 border border-transparent hover:border-white p-2 cursor-pointer" onClick={() => navigateTo('login')}>
        <MapPin size={18} className="mt-2" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 leading-tight">Deliver to</span>
          <span className="text-sm font-bold leading-tight">United States</span>
        </div>
      </div>

      <div className="flex-1 flex h-10 group">
        <div className="bg-[#f3f3f3] text-black text-xs flex items-center px-3 rounded-l-md border-r border-gray-300 cursor-pointer hover:bg-gray-200 hidden sm:flex">
          All <ChevronDown size={12} className="ml-1" />
        </div>
        <input 
          type="text" 
          className="flex-1 px-3 text-black focus:outline-none border-y-2 border-transparent focus:border-[#f3a847]"
          placeholder="Search Amazon"
          value={searchTerm || ''}
          onChange={(e) => onSearch(e.target.value)}
        />
        <div className="bg-[#febd69] hover:bg-[#f3a847] flex items-center justify-center px-4 rounded-r-md cursor-pointer text-black">
          <Search size={22} strokeWidth={3} />
        </div>
      </div>

      <div className="hidden md:flex flex-col border border-transparent hover:border-white p-2 cursor-pointer leading-tight" onClick={() => navigateTo('login')}>
        <span className="text-xs">Hello, sign in</span>
        <span className="text-sm font-bold flex items-center">Account & Lists <ChevronDown size={14} className="ml-1 text-gray-400" /></span>
      </div>

      <div className="flex items-center gap-1 border border-transparent hover:border-white p-2 cursor-pointer relative" onClick={() => navigateTo('cart')}>
        <div className="relative">
          <ShoppingCart size={32} />
          <span className="absolute top-[-2px] left-[15px] text-[#f08804] rounded-full w-5 h-5 flex items-center justify-center font-bold text-base">{cartCount || 0}</span>
        </div>
        <span className="text-sm font-bold mt-3 hidden sm:block">Cart</span>
      </div>
    </div>
    <div className="bg-[#232f3e] flex items-center px-4 py-1 gap-4 text-sm font-medium overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 cursor-pointer border border-transparent hover:border-white p-1 whitespace-nowrap"><Menu size={20} /><span>All</span></div>
      {['Today\'s Deals', 'Customer Service', 'Registry', 'Gift Cards', 'Sell', 'Prime', 'Electronics', 'Home & Kitchen', 'New Releases', 'Books', 'Toys & Games'].map(item => (
        <div key={item} className="cursor-pointer border border-transparent hover:border-white p-1 whitespace-nowrap">{item}</div>
      ))}
    </div>
  </header>
);

const ProductDetail = ({ product, addToCart, goBack }: any) => {
  const [activeImage, setActiveImage] = useState(product?.images?.[0] || '');
  const [currentReviews, setCurrentReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    const fetchFreshReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('id', { ascending: false });
        if (error) throw error;
        setCurrentReviews(data || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setCurrentReviews(product?.customerReviews || []);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchFreshReviews();
    if (product?.images?.length > 0) {
      setActiveImage(product.images[0]);
    }
    window.scrollTo(0, 0);
  }, [product?.id]);
  
  const averageRating = useMemo(() => {
    if (!Array.isArray(currentReviews) || currentReviews.length === 0) return Number(product?.rating) || 4.5;
    const sum = currentReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
    return sum / currentReviews.length;
  }, [currentReviews, product?.rating]);

  if (!product) return null;

  const deliveryDateString = getDeliveryDate(1);
  const deliveryShortDate = deliveryDateString.includes(',') ? deliveryDateString.split(',')[1].trim() : deliveryDateString;

  return (
    <div className="bg-white min-h-screen text-[#0f1111] antialiased pb-20">
      <div className="max-w-[1500px] mx-auto px-4 py-4">
        <div className="flex items-center gap-1 text-xs text-[#565959] mb-4">
          <span className="hover:underline cursor-pointer hover:text-[#c45500]" onClick={goBack}>Home</span>
          <ChevronRight size={10} />
          <span className="hover:underline cursor-pointer hover:text-[#c45500]">{product.category || 'Featured'}</span>
          <ChevronRight size={10} />
          <span className="truncate max-w-[200px] font-medium text-gray-400">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col md:flex-row gap-4">
            <div className="flex flex-row md:flex-col gap-2 order-2 md:order-1 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {(product.images || []).map((img: string, i: number) => (
                <div 
                  key={i} 
                  onMouseEnter={() => setActiveImage(img)} 
                  className={`w-12 h-12 lg:w-16 lg:h-16 border rounded-md overflow-hidden cursor-pointer flex-shrink-0 p-1 bg-white ${activeImage === img ? 'border-[#e77600] ring-2 ring-orange-100 shadow-sm' : 'border-gray-300 hover:border-[#e77600]'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" onError={handleImageError} />
                </div>
              ))}
            </div>
            <div className="flex-1 order-1 md:order-2 sticky top-28 h-fit bg-white z-10">
              <ImageZoom src={activeImage} />
            </div>
          </div>

          <div className="lg:col-span-4 xl:col-span-5 space-y-4">
            <div className="border-b pb-4">
              <h1 className="text-2xl font-medium leading-tight mb-2 tracking-tight">{product.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer text-sm font-medium">Brand: {product.brand_info?.split('\n')[0] || 'Official Store'}</span>
                <div className="flex items-center gap-1 border-l pl-2">
                  <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
                  <StarRating rating={averageRating} />
                  <span className="text-sm text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">
                    {formatNumber(product.reviews_count || currentReviews.length)} ratings
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[#B12704] text-xl font-light">-18%</span>
                <div className="flex items-start text-[#0f1111]">
                  <span className="text-sm mt-1 font-medium">$</span>
                  <span className="text-4xl font-medium">{Math.floor(Number(product.price || 0))}</span>
                  <span className="text-sm mt-1 font-medium">{(Number(product.price || 0) % 1).toFixed(2).substring(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50/50 p-2 border rounded border-dashed">
                <img src="https://m.media-amazon.com/images/G/01/prime/marketing/slashPrime/amazon-prime-delivery-checkmark._CB611054930_.png" alt="Prime" className="h-4" />
                <span className="text-sm text-[#565959]">Get it as soon as <span className="text-black font-bold">Tomorrow, {deliveryShortDate}</span></span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base">About this item</h3>
              <ul className="list-disc ml-5 text-sm space-y-3 text-[#0f1111] leading-relaxed">
                {(product.features || "High quality product").split('\n').filter(Boolean).map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg p-5 space-y-4 shadow-sm bg-white sticky top-28 h-fit">
              <div className="flex items-start text-[#0f1111]">
                <span className="text-sm mt-1 font-medium">$</span>
                <span className="text-3xl font-medium">{(Number(product.price || 0) - (isCouponApplied ? 10 : 0)).toFixed(2)}</span>
              </div>
              <p className="text-lg text-[#007600] font-medium">In Stock</p>
              <div className="space-y-3">
                <button 
                  onClick={() => addToCart(product)} 
                  className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black rounded-full py-2 font-medium text-sm shadow-sm border border-[#fcd200]"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ products = [], onSaveProduct, onDeleteProduct, onLogout }: any) => {
  const [editingProduct, setEditingProduct] = useState<any>(null);
  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="bg-[#232f3e] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold flex items-center gap-2"><Settings size={22} /> Amazon Dashboard</h1>
        <button onClick={onLogout} className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"><LogOut size={18} /> Exit</button>
      </div>
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-2xl font-black">Catalog Management</h2>
            <button onClick={() => setEditingProduct({ id: 0, title: '', price: 0, images: [''], category: '', features: '' })} className="bg-[#f0c14b] px-6 py-2 rounded font-black border border-[#a88734]">Add Item</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-4 text-xs font-black uppercase">Preview</th>
                <th className="p-4 text-xs font-black uppercase">Title</th>
                <th className="p-4 text-xs font-black uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(products) ? products : []).map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4"><img src={p.images?.[0]} className="w-10 h-10 object-contain" onError={handleImageError} /></td>
                  <td className="p-4 font-bold">{p.title?.substring(0, 50)}...</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600"><Edit size={18} /></button>
                    <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-8 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-6">{editingProduct.id === 0 ? 'New Item' : 'Edit Item'}</h3>
            <div className="space-y-4">
              <input className="w-full p-4 border rounded" placeholder="Title" value={editingProduct.title || ''} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} />
              <input className="w-full p-4 border rounded" type="number" placeholder="Price" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
              <textarea className="w-full p-4 border rounded h-32" placeholder="Images (URL per line)" value={editingProduct.images?.join('\n') || ''} onChange={e => setEditingProduct({...editingProduct, images: (e.target.value || '').split('\n')})} />
              <div className="flex gap-4">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-gray-100 rounded">Cancel</button>
                <button onClick={() => { onSaveProduct(editingProduct); setEditingProduct(null); }} className="flex-1 py-4 bg-blue-600 text-white rounded font-bold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginView = ({ onLogin, onCancel }: any) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-24">
      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="h-10 mb-12 cursor-pointer" onClick={onCancel} />
      <div className="w-[400px] border border-gray-300 rounded-2xl p-10 shadow-xl">
        <h1 className="text-3xl font-black mb-8">Admin Portal</h1>
        <form onSubmit={e => { e.preventDefault(); onLogin(u, p); }} className="space-y-6">
          <input className="w-full border p-4 rounded outline-none focus:ring-2 focus:ring-orange-200" placeholder="Credential ID" value={u} onChange={e => setU(e.target.value)} />
          <input type="password" className="w-full border p-4 rounded outline-none focus:ring-2 focus:ring-orange-200" placeholder="Security Key" value={p} onChange={e => setP(e.target.value)} />
          <button className="w-full bg-[#f0c14b] py-4 rounded font-black border border-[#a88734]">Establish Link</button>
        </form>
      </div>
    </div>
  );
};

const Footer = ({ goHome }: any) => (
  <footer className="mt-auto">
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full bg-[#37475a] text-white py-4 text-sm font-bold">Back to top</button>
    <div className="bg-[#232f3e] text-white py-16 px-8 text-center">
      <img src="https://pngimg.com/uploads/amazon/amazon_PNG11.png" className="h-10 mx-auto mb-8 opacity-60 cursor-pointer" onClick={goHome} />
      <p className="text-[10px] text-gray-500 uppercase tracking-widest">© 1996-2024, High Fidelity Storefront. Simulated Experience.</p>
    </div>
  </footer>
);

export default function AmazonClone() {
  const [view, setView] = useState<'home' | 'detail' | 'cart' | 'login' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryCard[]>([]);

  // Function to sync current state with URL
  const navigateTo = useCallback((newView: typeof view, productId?: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('view', newView);
    if (productId) params.set('product', productId.toString());
    else params.delete('product');
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ view: newView, productId }, "", newUrl);
    
    setView(newView);
    if (productId) {
      const p = products.find(prod => prod.id === productId);
      if (p) setSelectedProduct(p);
    } else {
      setSelectedProduct(null);
    }
  }, [products]);

  const goHome = useCallback(() => {
    setSelectedProduct(null);
    setSearchTerm('');
    navigateTo('home');
  }, [navigateTo]);

  const onProductSelect = useCallback((p: Product) => {
    if (!p) return;
    setSelectedProduct(p);
    navigateTo('detail', p.id);
  }, [navigateTo]);

  // Sync state with URL parameters on mount and history navigation
  useEffect(() => {
    const syncWithUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get('view') as any;
        const urlProductId = params.get('product');

        if (urlView && ['home', 'detail', 'cart', 'login', 'admin'].includes(urlView)) {
          setView(urlView);
        } else {
          setView('home');
        }

        if (urlProductId && products.length > 0) {
          const pId = parseInt(urlProductId);
          const p = products.find(prod => prod.id === pId);
          if (p) setSelectedProduct(p);
        }
      } catch (e) {
        console.error("URL Sync Error", e);
      }
    };

    window.addEventListener('popstate', syncWithUrl);
    syncWithUrl(); 
    return () => window.removeEventListener('popstate', syncWithUrl);
  }, [products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase.from('products').select('*, reviews(*)').order('id', { ascending: false });
      if (pError) throw pError;

      const formatted = (pData || []).map((p: any) => ({ 
        ...p, 
        customerReviews: Array.isArray(p.reviews) ? p.reviews : [] 
      }));
      setProducts(formatted);

      const { data: cData } = await supabase.from('site_config').select('*');
      if (cData) {
        const catsObj = cData.find(d => d.key === 'categories');
        if (catsObj) setCategories(Array.isArray(catsObj.value) ? catsObj.value : []);
      }
    } catch (err) { 
      console.error("Data Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSaveProduct = async (p: any) => {
    try {
      if (p.id === 0) {
        await supabase.from('products').insert([p]);
      } else {
        const { id, customerReviews, reviews, ...rest } = p;
        await supabase.from('products').update(rest).eq('id', id);
      }
      await fetchData();
    } catch (e) { 
      console.error("Save failed:", e); 
      alert("Save operation failed.");
    }
  };

  const onDeleteProduct = async (id: number) => {
    if (confirm("Delete product?")) {
      try {
        await supabase.from('products').delete().eq('id', id);
        await fetchData();
      } catch (e) {
        console.error("Delete failed:", e);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => p?.title?.toLowerCase().includes((searchTerm || '').toLowerCase()));
  }, [products, searchTerm]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eaeded]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#232f3e]" size={40} />
          <p className="font-bold uppercase text-xs tracking-widest text-gray-500">Connecting Storefront...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#0f1111]">
      {view !== 'login' && view !== 'admin' && (
        <Header cartCount={cart.length} onSearch={setSearchTerm} navigateTo={navigateTo} searchTerm={searchTerm} goHome={goHome} />
      )}
      <main className="flex-1 bg-[#eaeded]">
        {view === 'login' && <LoginView onLogin={(u:any, p:any) => (u === '@Amazon project' && p === '@Amazon project123') ? navigateTo('admin') : alert("Auth Error")} onCancel={goHome} />}
        {view === 'admin' && <AdminPanel products={products} onSaveProduct={onSaveProduct} onDeleteProduct={onDeleteProduct} onLogout={goHome} />}
        {view === 'home' && (
          <div className="pb-20">
            <div className="relative h-[300px] md:h-[650px] overflow-hidden">
              <img src="https://m.media-amazon.com/images/I/71Ie3JXGfVL._SX3000_.jpg" className="w-full h-full object-cover" alt="Hero" />
              <div className="absolute inset-0 hero-gradient"></div>
            </div>
            <div className="max-w-[1500px] mx-auto px-4 mt-[-150px] md:mt-[-420px] relative z-10 space-y-8">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat, i) => (
                  <div key={i} className="bg-white p-6 shadow-xl rounded-sm">
                    <h2 className="text-xl font-bold mb-4">{cat.title}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {(cat.items || []).map((item, j) => (
                        <div key={j} className="flex flex-col cursor-pointer group">
                          <img src={item.image} className="h-28 object-contain bg-gray-50 p-2 rounded group-hover:scale-105 transition-transform" onError={handleImageError} alt={item.label} />
                          <span className="text-[11px] font-bold mt-2 truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-8 shadow-md rounded-sm">
                <h2 className="text-2xl font-black mb-8 border-b pb-4 uppercase tracking-tighter">Top Trending Releases</h2>
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="cursor-pointer border border-gray-100 p-5 rounded-sm bg-white flex flex-col group hover:shadow-lg transition-all" onClick={() => onProductSelect(p)}>
                      <div className="h-56 flex items-center justify-center mb-6 overflow-hidden">
                        <img src={p.images?.[0]} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" onError={handleImageError} alt={p.title} />
                      </div>
                      <h3 className="text-sm font-medium line-clamp-2 h-10 text-[#007185] group-hover:underline">{p.title}</h3>
                      <div className="mt-auto pt-4 flex items-center gap-1 font-black text-xl">
                        <span className="text-sm font-bold mt-1">$</span>{Math.floor(p.price || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {view === 'detail' && selectedProduct && <ProductDetail product={selectedProduct} addToCart={(p:any) => setCart(prev => [...prev, p])} goBack={goHome} />}
        {view === 'cart' && (
          <div className="p-4 md:p-12 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded shadow-xl">
              <h1 className="text-2xl md:text-3xl font-black border-b pb-6 mb-8 uppercase tracking-tighter">Shopping Basket</h1>
              {cart.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <ShoppingCart size={60} className="text-gray-200" />
                  <p className="text-xl text-gray-400 font-bold">Your basket is empty.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {cart.map((item, i) => (
                    <div key={i} className="flex flex-col md:flex-row gap-8 border-b pb-10 last:border-0">
                      <img src={item.images?.[0]} className="w-full md:w-48 h-48 object-contain cursor-pointer" onClick={() => onProductSelect(item)} onError={handleImageError} alt={item.title} />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold hover:underline cursor-pointer" onClick={() => onProductSelect(item)}>{item.title}</h3>
                        <p className="text-2xl font-black mt-4">${Number(item.price || 0).toFixed(2)}</p>
                        <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-xs text-red-500 font-bold mt-6 uppercase hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer goHome={goHome} />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<AmazonClone />);
}
