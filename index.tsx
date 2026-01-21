
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, ShoppingCart, MapPin, Menu, ChevronRight, Star, ChevronLeft, X,
  Plus, Minus, ArrowLeft, Check, Edit, Trash2, Settings, Image as ImageIcon,
  Save, LogOut, User, ThumbsUp, Layout, Globe, Info, Loader2, ChevronUp, ChevronDown,
  ShieldCheck, Truck, Lock, RotateCcw, MessageSquare, ExternalLink
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
  e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found";
};

const formatNumber = (num: number) => {
  if (typeof num !== 'number') return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

const getDeliveryDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
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

const ReviewDistribution = ({ reviews }: { reviews: Review[] }) => {
  const counts = [0, 0, 0, 0, 0];
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  safeReviews.forEach(r => {
    const rVal = Number(r.rating);
    if (rVal >= 1 && rVal <= 5) {
      const idx = 5 - Math.floor(rVal);
      if (counts[idx] !== undefined) counts[idx]++;
    }
  });
  const total = safeReviews.length || 1;

  return (
    <div className="space-y-2 mb-6 w-full max-w-[300px]">
      {[5, 4, 3, 2, 1].map((star, idx) => {
        const percentage = Math.round((counts[idx] / total) * 100);
        return (
          <div key={star} className="flex items-center gap-4 text-sm hover:bg-gray-50 p-0.5 cursor-pointer group">
            <span className="text-[#007185] group-hover:text-[#c45500] whitespace-nowrap w-12 text-xs font-medium">{star} star</span>
            <div className="flex-1 h-4 bg-gray-100 border border-gray-300 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-[#ffa41c] border-r border-gray-400" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-[#007185] group-hover:text-[#c45500] w-8 text-right text-xs">{percentage}%</span>
          </div>
        );
      })}
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
        className={`w-full h-full object-contain transition-transform duration-100 ${zoomPos.visible ? 'scale-[2.5]' : 'scale-100'}`}
        style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
      />
    </div>
  );
};

// --- Main Components ---

const Header = ({ cartCount, onSearch, setView, searchTerm, onLoginTrigger, goHome }: any) => (
  <header className="bg-[#131921] text-white sticky top-0 z-50">
    <div className="flex items-center px-4 py-2 gap-4">
      <div className="flex items-center cursor-pointer border border-transparent hover:border-white p-1" onClick={goHome}>
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

      <div className="hidden md:flex flex-col border border-transparent hover:border-white p-2 cursor-pointer leading-tight" onClick={onLoginTrigger}>
        <span className="text-xs">Hello, sign in</span>
        <span className="text-sm font-bold flex items-center">Account & Lists <ChevronDown size={14} className="ml-1 text-gray-400" /></span>
      </div>

      <div className="flex items-center gap-1 border border-transparent hover:border-white p-2 cursor-pointer relative" onClick={() => setView('cart')}>
        <div className="relative">
          <ShoppingCart size={32} />
          <span className="absolute top-[-2px] left-[15px] text-[#f08804] rounded-full w-5 h-5 flex items-center justify-center font-bold text-base">{cartCount || 0}</span>
        </div>
        <span className="text-sm font-bold mt-3 hidden sm:block">Cart</span>
      </div>
    </div>
    <div className="bg-[#232f3e] flex items-center px-4 py-1 gap-4 text-sm font-medium overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 cursor-pointer border border-transparent hover:border-white p-1"><Menu size={20} /><span>All</span></div>
      {['Today\'s Deals', 'Customer Service', 'Registry', 'Gift Cards', 'Sell', 'Prime', 'Electronics', 'Home & Kitchen'].map(item => (
        <div key={item} className="cursor-pointer border border-transparent hover:border-white p-1 whitespace-nowrap">{item}</div>
      ))}
    </div>
  </header>
);

const ProductDetail = ({ product, allProducts, addToCart, goBack, onProductSelect }: any) => {
  const [activeImage, setActiveImage] = useState(product?.images?.[0] || '');
  const [currentReviews, setCurrentReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

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
    if (product?.images && product.images.length > 0) setActiveImage(product.images[0]);
    window.scrollTo(0, 0);
  }, [product?.id]);
  
  const averageRating = useMemo(() => {
    if (!Array.isArray(currentReviews) || currentReviews.length === 0) return Number(product?.rating) || 4.5;
    const sum = currentReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
    return sum / currentReviews.length;
  }, [currentReviews, product?.rating]);

  const comparisonProducts = useMemo(() => {
    if (!Array.isArray(allProducts) || !product) return [];
    return allProducts.filter(p => p && p.id !== product.id).slice(0, 4);
  }, [allProducts, product?.id]);

  if (!product) return (
    <div className="p-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>
  );

  return (
    <div className="bg-white min-h-screen text-[#0f1111] antialiased">
      <div className="max-w-[1500px] mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-xs text-[#565959] mb-4">
          <span className="hover:underline cursor-pointer hover:text-[#c45500]" onClick={goBack}>Home</span>
          <ChevronRight size={10} />
          <span className="hover:underline cursor-pointer hover:text-[#c45500]">{product.category || 'Featured'}</span>
          <ChevronRight size={10} />
          <span className="truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: Images */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col md:flex-row gap-4">
            <div className="flex flex-row md:flex-col gap-2 order-2 md:order-1 overflow-x-auto no-scrollbar">
              {(product.images || []).map((img: string, i: number) => (
                <div 
                  key={i} 
                  onMouseEnter={() => setActiveImage(img)} 
                  className={`w-10 h-10 lg:w-14 lg:h-14 border rounded-md overflow-hidden cursor-pointer flex-shrink-0 p-1 ${activeImage === img ? 'border-[#e77600] ring-2 ring-orange-100 shadow-sm' : 'border-gray-300 hover:border-[#e77600]'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" onError={handleImageError} />
                </div>
              ))}
            </div>
            <div className="flex-1 order-1 md:order-2 sticky top-28 h-fit">
              <ImageZoom src={activeImage} />
              <p className="text-center text-[#565959] text-xs mt-4">Roll over image to zoom in</p>
            </div>
          </div>

          {/* Column 2: Product Info */}
          <div className="lg:col-span-4 xl:col-span-5 space-y-4">
            <div className="border-b pb-4">
              <h1 className="text-2xl font-medium leading-tight mb-2 tracking-tight">{product.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer text-sm font-medium">Brand: {product.brand_info?.split('\n')[0] || 'Storefront'}</span>
                <div className="flex items-center gap-1 border-l pl-2">
                  <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
                  <StarRating rating={averageRating} />
                  <ChevronDown size={12} className="text-[#565959]" />
                  <span className="text-sm text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">
                    {formatNumber(product.reviews_count || currentReviews.length)} ratings
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-[#232f3e] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">Amazon's Choice</span>
                <span className="text-xs text-[#565959]">in {product.category || 'Electronics'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[#B12704] text-xl font-light">-15%</span>
                <div className="flex items-start text-[#0f1111]">
                  <span className="text-sm mt-1 font-medium">$</span>
                  <span className="text-3xl font-medium">{Math.floor(Number(product.price || 0))}</span>
                  <span className="text-sm mt-1 font-medium">{(Number(product.price || 0) % 1).toFixed(2).substring(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://m.media-amazon.com/images/G/01/prime/marketing/slashPrime/amazon-prime-delivery-checkmark._CB611054930_.png" alt="Prime" className="h-4" />
                <span className="text-sm text-[#565959]">One-Day</span>
                <span className="text-sm font-bold text-black">FREE Returns</span>
              </div>
            </div>

            <div className="border-y py-4">
               <div className="grid grid-cols-2 gap-y-2 text-sm max-w-sm">
                  <span className="font-bold">Brand</span>
                  <span className="truncate">{product.brand_info?.split('\n')[0] || 'Generic'}</span>
                  <span className="font-bold">Product info</span>
                  <span className="truncate text-xs text-gray-600 italic">{product.product_info?.substring(0, 30)}...</span>
                  <span className="font-bold">Specific uses</span>
                  <span>Personal, Business</span>
               </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base">About this item</h3>
              <ul className="list-disc ml-5 text-sm space-y-2 text-[#0f1111] leading-relaxed">
                {(product.features || "High performance materials\nErgonomic design\nManufacturer warranty included").split('\n').filter(Boolean).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <button className="text-sm text-[#007185] hover:text-[#c45500] hover:underline font-bold mt-2">See more product details</button>
            </div>
          </div>

          {/* Column 3: Buy Box */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg p-5 space-y-4 shadow-sm bg-white sticky top-28 h-fit">
              <div className="flex items-start text-[#0f1111]">
                <span className="text-sm mt-1 font-medium">$</span>
                <span className="text-3xl font-medium">{Number(product.price || 0).toFixed(2)}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-[#565959]">
                  Get <span className="font-bold">FREE delivery</span> <span className="text-black font-bold">{getDeliveryDate(1)}</span> if you order within <span className="text-[#007600] font-medium">10 hrs 15 mins</span>
                </p>
                <div className="flex items-center gap-1 text-[#007185] hover:text-[#c45500] hover:underline text-xs cursor-pointer">
                  <MapPin size={14} className="text-black" />
                  <span>Deliver to United States</span>
                </div>
              </div>

              <p className="text-lg text-[#007600] font-medium">In Stock</p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-[#f0f2f2] border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors">
                  <span className="text-xs">Qty:</span> <span className="text-xs font-bold">1</span> <ChevronDown size={14} className="ml-auto" />
                </div>
                
                <button 
                  onClick={() => addToCart(product)} 
                  className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black rounded-full py-2 font-medium text-sm shadow-sm border border-[#fcd200] active:ring-2 active:ring-orange-200"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => product.buy_now_url ? window.open(product.buy_now_url, '_blank') : alert('Order confirmed!')} 
                  className="w-full bg-[#ffa41c] hover:bg-[#fa8900] text-black rounded-full py-2 font-medium text-sm shadow-sm border border-[#ca8114] active:ring-2 active:ring-orange-200"
                >
                  Buy Now
                </button>
              </div>

              <div className="text-xs space-y-1 border-t pt-4">
                <div className="flex gap-4"><span className="text-[#565959] w-20">Ships from</span><span>Amazon.com</span></div>
                <div className="flex gap-4"><span className="text-[#565959] w-20">Sold by</span><span className="text-[#007185] cursor-pointer">Amazon.com</span></div>
                <div className="flex gap-4 mt-2"><span className="text-[#565959] w-20">Returns</span><span className="text-[#007185] cursor-pointer">Eligible for Return</span></div>
                <div className="flex items-center gap-2 text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer mt-4 font-medium"><Lock size={14} className="text-gray-400" /><span>Secure transaction</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Icons */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y bg-gray-50/30">
            <div className="flex flex-col items-center text-center space-y-2">
              <RotateCcw className="text-[#565959]" size={32} />
              <p className="text-[11px] font-bold text-[#007185] hover:underline cursor-pointer">30-day return policy</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck className="text-[#565959]" size={32} />
              <p className="text-[11px] font-bold text-[#007185] hover:underline cursor-pointer">Amazon Delivered</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck className="text-[#565959]" size={32} />
              <p className="text-[11px] font-bold text-[#007185] hover:underline cursor-pointer">Secure transaction</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <ImageIcon className="text-[#565959]" size={32} />
              <p className="text-[11px] font-bold text-[#007185] hover:underline cursor-pointer">Brand Direct</p>
            </div>
        </div>

        {/* Comparison Table */}
        {comparisonProducts.length > 0 && (
          <div className="mt-12 overflow-x-auto">
            <h2 className="text-xl font-bold mb-6">Compare with similar items</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-4 bg-gray-50 text-left w-48">Feature</th>
                  <th className="p-4 text-center border-l bg-orange-50/30">This item</th>
                  {comparisonProducts.map(p => (
                    <th key={p.id} className="p-4 text-center border-l hover:bg-gray-50 cursor-pointer" onClick={() => onProductSelect(p)}>{p.title.substring(0, 30)}...</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Image</td>
                  <td className="p-4 text-center border-l"><img src={product.images[0]} className="h-20 mx-auto object-contain" /></td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l"><img src={p.images[0]} className="h-20 mx-auto object-contain" /></td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Price</td>
                  <td className="p-4 text-center border-l text-[#B12704] font-bold">${product.price.toFixed(2)}</td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l">${p.price.toFixed(2)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Sold By</td>
                  <td className="p-4 text-center border-l">Amazon.com</td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l">Global Store</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12 border-t pt-12 grid lg:grid-cols-12 gap-12">
           <div className="lg:col-span-4 sticky top-28 h-fit">
              <h2 className="text-xl font-bold mb-2">Customer reviews</h2>
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={averageRating} size={22} />
                <span className="font-bold text-lg">{averageRating.toFixed(1)} out of 5</span>
              </div>
              <p className="text-sm text-[#565959] mb-6">{formatNumber(currentReviews.length)} global ratings</p>
              <ReviewDistribution reviews={currentReviews} />
              <div className="border-t pt-6 space-y-4">
                 <h3 className="font-bold">Review this product</h3>
                 <p className="text-sm">Share your thoughts with other customers</p>
                 <button className="w-full border border-gray-300 rounded-lg py-1.5 text-sm font-medium hover:bg-gray-100 bg-white shadow-sm transition-colors">Write a customer review</button>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-8">
              <h3 className="text-xl font-bold">Top reviews from the United States</h3>
              {loadingReviews ? (
                <div className="flex flex-col items-center gap-4 py-12 text-gray-400">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Loading real-time reviews...</p>
                </div>
              ) : currentReviews.length === 0 ? (
                <p className="italic text-gray-500">No customer reviews yet.</p>
              ) : (
                currentReviews.map((review: any) => (
                  <div key={review.id} className="space-y-2 border-b border-gray-100 pb-8 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#f0f2f2] rounded-full w-8 h-8 flex items-center justify-center">
                        <User size={18} className="text-[#a7abb1]" />
                      </div>
                      <span className="text-sm font-medium">{review.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={16} />
                      <span className="text-sm font-bold truncate max-w-xs">{review.comment?.substring(0, 40)}...</span>
                    </div>
                    <p className="text-xs text-[#565959]">Reviewed in the US on {review.date}</p>
                    <span className="text-xs font-bold text-[#c45500]">Verified Purchase</span>
                    <p className="text-sm leading-relaxed text-[#0f1111] whitespace-pre-wrap mt-2">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-4">
                       <button className="px-6 py-1 border border-gray-300 rounded-lg text-xs font-medium shadow-sm hover:bg-gray-50 bg-white">Helpful</button>
                       <span className="text-xs text-gray-400 border-l pl-4 cursor-pointer hover:underline">Report</span>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin & Global Logic ---

const AdminPanel = ({ 
  products = [], onSaveProduct, onDeleteProduct, onLogout, 
  heroes = [], onSaveHeroes, categories = [], onSaveCategories 
}: any) => {
  const [activeTab, setActiveTab] = useState<'products' | 'home'>('products');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedProducts = useMemo(() => {
    let sortableItems = Array.isArray(products) ? [...products] : [];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronUp size={14} className="opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="bg-[#232f3e] text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}><Settings size={22} /> Admin Control</h1>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('products')} className={`px-4 py-1 rounded-full text-sm font-medium ${activeTab === 'products' ? 'bg-white text-black' : 'hover:bg-white/10'}`}>Products</button>
            <button onClick={() => setActiveTab('home')} className={`px-4 py-1 rounded-full text-sm font-medium ${activeTab === 'home' ? 'bg-white text-black' : 'hover:bg-white/10'}`}>Site Assets</button>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1 text-sm font-bold text-red-400 hover:text-red-300"><LogOut size={18} /> Logout</button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 text-[#0f1111]">
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Catalog Management</h2>
              <button onClick={() => setEditingProduct({ id: 0, title: '', price: 0, reviews_count: 0, images: [''], description: '', features: '', brand_info: '', product_info: '', buy_now_url: '', customerReviews: [] })} className="bg-[#f0c14b] px-6 py-2 rounded-lg font-bold border border-[#a88734] hover:bg-[#e2b13c]">Add New Product</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Image</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('title')}>
                      <div className="flex items-center gap-1">Product Title {getSortIcon('title')}</div>
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => requestSort('price')}>
                      <div className="flex items-center gap-1">Price {getSortIcon('price')}</div>
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4"><img src={p.images?.[0] || ''} className="w-10 h-10 object-contain bg-white border rounded" onError={handleImageError} /></td>
                      <td className="p-4 font-medium text-gray-800 text-sm line-clamp-1">{p.title}</td>
                      <td className="p-4 font-bold text-green-700 text-sm">${Number(p.price || 0).toFixed(2)}</td>
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

        {editingProduct && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">{editingProduct.id === 0 ? 'Create Product' : 'Modify Product'}</h3>
                <button onClick={() => setEditingProduct(null)}><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Product Title</label>
                  <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none" value={editingProduct.title || ''} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Price ($)</label>
                    <input type="number" step="0.01" className="w-full p-2 border rounded" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Category</label>
                    <input className="w-full p-2 border rounded" value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Images (one URL per line)</label>
                  <textarea className="w-full p-2 border rounded h-24 font-mono text-xs" value={editingProduct.images?.join('\n') || ''} onChange={e => setEditingProduct({...editingProduct, images: e.target.value.split('\n')})} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">About (Bullet points)</label>
                  <textarea className="w-full p-2 border rounded h-32" value={editingProduct.features || ''} onChange={e => setEditingProduct({...editingProduct, features: e.target.value})} />
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button onClick={() => setEditingProduct(null)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={() => { onSaveProduct(editingProduct); setEditingProduct(null); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply Changes</button>
                </div>
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
        <h1 className="text-3xl font-medium mb-6">Admin Login</h1>
        <form onSubmit={e => { e.preventDefault(); onLogin(u, p); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold">Username</label>
            <input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-100" value={u} onChange={e => setU(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">Password</label>
            <input type="password" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-100" value={p} onChange={e => setP(e.target.value)} required />
          </div>
          <button className="w-full bg-[#f0c14b] py-3 rounded-lg font-bold border border-[#a88734] shadow-md hover:bg-[#e2b13c] transition-colors">Sign in</button>
        </form>
        <button onClick={onCancel} className="w-full mt-6 text-sm text-blue-600 hover:text-orange-600 font-medium">Return to shopping</button>
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
            <li className="hover:underline">Become an Affiliate</li>
            <li className="hover:underline">Advertise Your Products</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-base">Amazon Payment</h4>
          <ul className="text-sm text-gray-300 space-y-2 cursor-pointer">
            <li className="hover:underline">Amazon Business Card</li>
            <li className="hover:underline">Shop with Points</li>
            <li className="hover:underline">Reload Your Balance</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-base">Let Us Help You</h4>
          <ul className="text-sm text-gray-300 space-y-2 cursor-pointer">
            <li className="hover:underline">Your Account</li>
            <li className="hover:underline">Your Orders</li>
            <li className="hover:underline">Returns & Replacements</li>
          </ul>
        </div>
      </div>
      <div className="mt-16 pt-12 border-t border-gray-700 text-center px-4">
        <img src="https://pngimg.com/uploads/amazon/amazon_PNG11.png" className="h-8 mx-auto mb-6 opacity-80 cursor-pointer" onClick={() => setView('home')} />
        <p className="text-xs text-gray-400">© 1996-2024, Amazon Clone Inc. Educational project for demonstration.</p>
      </div>
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
  const [heroes, setHeroes] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryCard[]>([]);

  const cartCount = Array.isArray(cart) ? cart.reduce((a, b) => a + (Number(b.quantity) || 1), 0) : 0;
  const cartSubtotal = Array.isArray(cart) ? cart.reduce((a, b) => a + Number(b.price || 0), 0) : 0;

  const goHome = () => {
    setView('home');
    setSelectedProduct(null);
    setSearchTerm('');
    window.history.pushState({}, "", window.location.pathname);
    window.scrollTo(0,0);
  };

  const onProductSelect = (p: Product) => {
    if (!p) return;
    setSelectedProduct(p);
    setView('detail');
    window.history.pushState({ productId: p.id }, "", `?product=${p.id}`);
    window.scrollTo(0,0);
  };

  const goBack = () => goHome();

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const productIdStr = params.get('product');
      if (productIdStr && products.length > 0) {
        const pId = parseInt(productIdStr);
        const product = products.find(p => p.id === pId);
        if (product) { setSelectedProduct(product); setView('detail'); }
        else { setView('home'); setSelectedProduct(null); }
      } else { setView('home'); setSelectedProduct(null); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase.from('products').select('*, reviews(*)').order('id', { ascending: false });
      if (pError) throw pError;
      const formattedProducts = (pData || []).map((p: any) => ({ ...p, customerReviews: Array.isArray(p.reviews) ? p.reviews : [] }));
      setProducts(formattedProducts);

      const { data: cData, error: cError } = await supabase.from('site_config').select('*');
      if (!cError && cData) {
        const heroesObj = cData.find(d => d.key === 'heroes');
        const catsObj = cData.find(d => d.key === 'categories');
        if (heroesObj) setHeroes(Array.isArray(heroesObj.value) ? heroesObj.value : []);
        if (catsObj) setCategories(Array.isArray(catsObj.value) ? catsObj.value : []);
      }

      const params = new URLSearchParams(window.location.search);
      const productIdStr = params.get('product');
      if (productIdStr && formattedProducts.length > 0) {
        const pId = parseInt(productIdStr);
        const found = formattedProducts.find((p: any) => p.id === pId);
        if (found) { setSelectedProduct(found); setView('detail'); }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onSaveProduct = async (p: any) => {
    const { id, customerReviews, reviews, ...productData } = p;
    let productId = id;
    if (id !== 0) {
      await supabase.from('products').update(productData).eq('id', id);
    } else {
      const { data } = await supabase.from('products').insert([productData]).select();
      productId = data?.[0]?.id;
    }
    if (productId && Array.isArray(customerReviews)) {
      await supabase.from('reviews').delete().eq('product_id', productId);
      const reviewsToInsert = customerReviews.map((r: any) => ({
        product_id: productId,
        user_name: r.user_name || 'Customer',
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        date: r.date || new Date().toLocaleDateString(),
        images: Array.isArray(r.images) ? r.images : []
      })).filter((r: any) => r.comment?.trim());
      if (reviewsToInsert.length > 0) await supabase.from('reviews').insert(reviewsToInsert);
    }
    await fetchData();
  };

  const onDeleteProduct = async (id: number) => {
    if (window.confirm("Delete this product permanently?")) {
      await supabase.from('products').delete().eq('id', id);
      await fetchData();
    }
  };

  const handleLogin = (u: string, p: string) => {
    if (u === '@Amazon project' && p === '@Amazon project123') setView('admin');
    else alert("Invalid credentials");
  };

  const filteredProducts = products.filter(p => p && p.title && p.title.toLowerCase().includes((searchTerm || '').toLowerCase()));

  if (loading && view === 'home' && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#eaeded]">
        <Loader2 className="animate-spin text-[#232f3e] mb-4" size={48} />
        <p className="font-bold text-[#232f3e]">Entering Store...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#0f1111]">
      {view !== 'login' && view !== 'admin' && (
        <Header cartCount={cartCount} onSearch={setSearchTerm} setView={setView} searchTerm={searchTerm} onLoginTrigger={() => setView('login')} goHome={goHome} />
      )}
      <main className="flex-1 bg-[#eaeded]">
        {view === 'login' && <LoginView onLogin={handleLogin} onCancel={() => setView('home')} />}
        {view === 'admin' && <AdminPanel products={products} onSaveProduct={onSaveProduct} onDeleteProduct={onDeleteProduct} onLogout={() => setView('home')} heroes={heroes} onSaveHeroes={(h: any) => setHeroes(h)} categories={categories} onSaveCategories={(c: any) => setCategories(c)} />}
        {view === 'home' && (
          <div className="pb-12">
            <div className="relative h-[250px] md:h-[600px] overflow-hidden">
               <img src={heroes[0] || "https://m.media-amazon.com/images/I/71Ie3JXGfVL._SX3000_.jpg"} className="w-full h-full object-cover" onError={handleImageError} />
               <div className="absolute inset-0 hero-gradient"></div>
            </div>
            <div className="max-w-[1500px] mx-auto px-4 mt-[-100px] md:mt-[-350px] relative z-10 space-y-6">
               <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.map(cat => (
                    <div key={cat.title} className="bg-white p-5 flex flex-col h-full shadow-lg rounded-sm">
                      <h2 className="text-xl font-bold mb-4">{cat.title}</h2>
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        {cat.items?.map((item, i) => (
                          <div key={i} className="flex flex-col cursor-pointer group">
                            <div className="h-28 flex items-center justify-center overflow-hidden mb-1">
                              <img src={item.image} alt={item.label} className="max-h-full object-contain group-hover:scale-105 transition-transform" onError={handleImageError} />
                            </div>
                            <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <a href="#" className="text-xs text-[#007185] hover:text-[#c45500] hover:underline mt-4 font-bold">See more</a>
                    </div>
                  ))}
               </div>
               <div className="bg-white p-6 shadow-lg rounded-sm min-h-[400px]">
                  <h2 className="text-2xl font-bold mb-6 border-b pb-4">Deals & Trending</h2>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="cursor-pointer hover:shadow-xl transition-all border p-4 rounded-sm bg-white flex flex-col group" onClick={() => onProductSelect(p)}>
                         <div className="h-48 w-full flex items-center justify-center mb-4 p-2 overflow-hidden">
                          <img src={p.images?.[0] || ''} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" onError={handleImageError} />
                         </div>
                         <h3 className="text-sm font-medium line-clamp-2 mb-2 leading-snug h-10 text-[#007185] group-hover:text-[#c45500] group-hover:underline">{p.title}</h3>
                         <div className="flex text-[#ffa41c] mb-1 items-center gap-1">
                           <StarRating rating={p.rating || 4.5} size={14} />
                           <span className="text-xs text-[#007185] hover:underline">{formatNumber(p.reviews_count || 0)}</span>
                         </div>
                         <div className="mt-auto pt-2">
                          <div className="flex items-start">
                              <span className="text-xs font-bold mt-1">$</span>
                              <p className="text-2xl font-bold">{Math.floor(Number(p.price || 0))}<span className="text-xs align-top">{(Number(p.price || 0) % 1).toFixed(2).substring(2)}</span></p>
                          </div>
                          <p className="text-[10px] text-[#565959] mt-1"><span className="font-bold">FREE delivery</span> Tomorrow</p>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}
        {view === 'detail' && selectedProduct && <ProductDetail product={selectedProduct} allProducts={products} addToCart={(p: Product) => setCart(c => [...c, {...p, quantity: 1}])} goBack={goBack} onProductSelect={onProductSelect} />}
        {view === 'cart' && (
          <div className="min-h-[80vh] p-4 md:p-8">
            <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="lg:col-span-3 bg-white p-6 rounded shadow-sm border">
                <h1 className="text-2xl font-bold border-b pb-4 mb-4">Shopping Cart</h1>
                {cartCount === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <p className="text-2xl text-gray-400 font-medium">Your Amazon Cart is empty.</p>
                    <button onClick={goHome} className="bg-[#f0c14b] px-8 py-2 rounded-lg font-bold border border-[#a88734]">Continue shopping</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-6 border-b pb-6 last:border-0">
                        <div className="w-44 h-44 flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={() => onProductSelect(item)}><img src={item.images?.[0] || ''} className="max-h-full max-w-full object-contain" onError={handleImageError} /></div>
                        <div className="flex-1 space-y-1">
                          <h3 className="text-lg font-medium hover:text-[#c45500] hover:underline cursor-pointer" onClick={() => onProductSelect(item)}>{item.title}</h3>
                          <p className="text-xs text-[#007600] font-bold">In Stock</p>
                          <div className="flex items-center gap-4 mt-3">
                            <button onClick={() => setCart(c => c.filter((_, i) => i !== idx))} className="text-xs text-[#007185] hover:underline">Delete</button>
                          </div>
                        </div>
                        <div className="text-right"><span className="font-bold text-lg">${Number(item.price || 0).toFixed(2)}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cartCount > 0 && (
                <div className="bg-white p-5 rounded shadow-sm border space-y-4 sticky top-24">
                  <div className="text-lg font-medium leading-snug">Subtotal ({cartCount} items): <span className="font-bold">${cartSubtotal.toFixed(2)}</span></div>
                  <button onClick={() => { if(window.confirm("Place order?")) { setCart([]); setView('home'); alert("Order successful!"); } }} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black rounded-lg py-2 font-medium text-sm border border-[#fcd200] shadow-sm">Proceed to checkout</button>
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
if (container) {
  const root = createRoot(container);
  root.render(<AmazonClone />);
}
