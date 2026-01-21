
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  // Prevent infinite loops if fallback also fails
  if (target.src.includes('placehold.co')) return;
  target.src = "https://placehold.co/600x400?text=Image+Not+Found";
};

const formatNumber = (num: number) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

const getDeliveryDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const formatted = date.toLocaleDateString('en-US', options);
  return formatted;
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
    <div className="space-y-2 mb-6 w-full">
      {[5, 4, 3, 2, 1].map((star, idx) => {
        const count = counts[idx];
        const percentage = Math.round((count / total) * 100);
        return (
          <div key={star} className="flex items-center gap-4 text-sm hover:bg-gray-50 p-0.5 cursor-pointer group">
            <span className="text-[#007185] group-hover:text-[#c45500] whitespace-nowrap w-12 text-xs font-medium">{star} star</span>
            <div className="flex-1 h-5 bg-gray-100 border border-gray-300 rounded-sm overflow-hidden">
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
        className={`w-full h-full object-contain transition-transform duration-100 ${zoomPos.visible ? 'scale-[2.8]' : 'scale-100'}`}
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
      <div className="flex items-center gap-1 cursor-pointer border border-transparent hover:border-white p-1 whitespace-nowrap"><Menu size={20} /><span>All</span></div>
      {['Today\'s Deals', 'Customer Service', 'Registry', 'Gift Cards', 'Sell', 'Prime', 'Electronics', 'Home & Kitchen', 'New Releases', 'Books', 'Toys & Games'].map(item => (
        <div key={item} className="cursor-pointer border border-transparent hover:border-white p-1 whitespace-nowrap">{item}</div>
      ))}
    </div>
  </header>
);

const ProductDetail = ({ product, allProducts, addToCart, goBack, onProductSelect }: any) => {
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
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      setActiveImage(product.images[0]);
    }
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

  const frequentlyBoughtTogether = useMemo(() => {
    if (!Array.isArray(allProducts) || !product) return [];
    return allProducts.filter(p => p && p.id !== product.id).slice(0, 2);
  }, [allProducts, product?.id]);

  if (!product) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-[#232f3e]" size={40} />
      <p className="text-gray-600 font-medium">Looking up product details...</p>
    </div>
  );

  const deliveryDateString = getDeliveryDate(1);
  const deliveryShortDate = deliveryDateString.includes(',') ? deliveryDateString.split(',')[1].trim() : deliveryDateString;

  return (
    <div className="bg-white min-h-screen text-[#0f1111] antialiased pb-20">
      <div className="max-w-[1500px] mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-xs text-[#565959] mb-4">
          <span className="hover:underline cursor-pointer hover:text-[#c45500]" onClick={goBack}>Home</span>
          <ChevronRight size={10} />
          <span className="hover:underline cursor-pointer hover:text-[#c45500]">{product.category || 'Featured'}</span>
          <ChevronRight size={10} />
          <span className="truncate max-w-[200px] font-medium text-gray-400">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: Images */}
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
              <p className="text-center text-[#565959] text-xs mt-4 font-medium flex items-center justify-center gap-2">
                <Search size={14} /> Roll over image to zoom in
              </p>
            </div>
          </div>

          {/* Column 2: Product Info */}
          <div className="lg:col-span-4 xl:col-span-5 space-y-4">
            <div className="border-b pb-4">
              <h1 className="text-2xl font-medium leading-tight mb-2 tracking-tight">{product.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer text-sm font-medium">Brand: {product.brand_info?.split('\n')[0] || 'Official Store'}</span>
                <div className="flex items-center gap-1 border-l pl-2">
                  <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
                  <StarRating rating={averageRating} />
                  <ChevronDown size={12} className="text-[#565959]" />
                  <span className="text-sm text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer">
                    {formatNumber(product.reviews_count || currentReviews.length)} ratings
                  </span>
                </div>
                <div className="border-l pl-2 text-sm text-[#565959]">
                   <span className="hover:text-[#c45500] hover:underline cursor-pointer">84 answered questions</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="bg-[#232f3e] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">Amazon's Choice</span>
                <span className="text-xs text-[#565959]">in <span className="text-[#007185] hover:underline cursor-pointer">{product.category || 'Electronics'}</span></span>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                  <Award size={14} className="text-green-600" />
                  <span className="text-[10px] font-bold text-green-700">CLIMATE PLEDGE FRIENDLY</span>
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#565959]">List Price: <span className="line-through">${(Number(product.price || 0) * 1.22).toFixed(2)}</span></span>
                <Info size={14} className="text-[#565959] cursor-pointer" />
              </div>

              {/* Coupon Section */}
              <div className="flex items-center gap-2 py-1">
                 <input 
                   type="checkbox" 
                   id="coupon" 
                   checked={isCouponApplied} 
                   onChange={() => setIsCouponApplied(!isCouponApplied)}
                   className="w-4 h-4 accent-[#007600] cursor-pointer"
                 />
                 <label htmlFor="coupon" className="flex items-center gap-2 cursor-pointer">
                    <span className="bg-[#e7f4e7] text-[#007600] text-xs font-bold px-2 py-0.5 border border-[#007600] rounded-sm">Coupon</span>
                    <span className="text-sm">Apply $10.00 coupon</span>
                    <Info size={14} className="text-[#565959]" />
                 </label>
              </div>

              <div className="flex items-center gap-2 bg-gray-50/50 p-2 border rounded border-dashed">
                <img src="https://m.media-amazon.com/images/G/01/prime/marketing/slashPrime/amazon-prime-delivery-checkmark._CB611054930_.png" alt="Prime" className="h-4" />
                <span className="text-sm text-[#565959]">Get it as soon as <span className="text-black font-bold">Tomorrow, {deliveryShortDate}</span></span>
              </div>
            </div>

            <div className="border-y py-4">
               <div className="grid grid-cols-2 gap-y-2 text-sm max-w-sm">
                  <span className="font-bold">Brand</span>
                  <span className="truncate">{product.brand_info?.split('\n')[0] || 'Official Brand'}</span>
                  <span className="font-bold">Color</span>
                  <span>Carbon Black / Starlight</span>
                  <span className="font-bold">Connectivity</span>
                  <span>Wireless, Bluetooth 5.3</span>
                  <span className="font-bold">Model Number</span>
                  <span className="font-mono text-xs">AZ-HFD-{product.id}-X</span>
               </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base">About this item</h3>
              <ul className="list-disc ml-5 text-sm space-y-3 text-[#0f1111] leading-relaxed">
                {(product.features || "Immersive spatial audio experience with dynamic head tracking\nPro-level active noise cancellation blocks up to 2x more noise\nTransparency mode lets you hear and interact with the world around you\nUp to 30 hours of total listening time with the charging case\nSweat and water resistant (IPX4) for non-water sports and exercise").split('\n').filter(Boolean).map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <button className="text-sm text-[#007185] hover:text-[#c45500] hover:underline font-bold mt-2 flex items-center gap-1">
                See more product details <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Column 3: Buy Box */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg p-5 space-y-4 shadow-sm bg-white sticky top-28 h-fit">
              <div className="flex items-start text-[#0f1111]">
                <span className="text-sm mt-1 font-medium">$</span>
                <span className="text-3xl font-medium">{(Number(product.price || 0) - (isCouponApplied ? 10 : 0)).toFixed(2)}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-[#565959]">
                  Get <span className="font-bold">FREE delivery</span> <span className="text-black font-bold">{getDeliveryDate(1)}</span>
                </p>
                <p className="text-sm text-[#565959]">
                  Or fastest delivery <span className="text-black font-bold">Today</span>. Order within <span className="text-[#007600] font-medium">5 hrs 12 mins</span>
                </p>
                <div className="flex items-center gap-1 text-[#007185] hover:text-[#c45500] hover:underline text-xs cursor-pointer pt-2">
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
                  onClick={() => product.buy_now_url ? window.open(product.buy_now_url, '_blank') : alert('Thank you for your order!')} 
                  className="w-full bg-[#ffa41c] hover:bg-[#fa8900] text-black rounded-full py-2 font-medium text-sm shadow-sm border border-[#ca8114] active:ring-2 active:ring-orange-200"
                >
                  Buy Now
                </button>
              </div>

              <div className="text-xs space-y-1.5 border-t pt-4">
                <div className="flex gap-4"><span className="text-[#565959] w-20">Ships from</span><span>Amazon.com</span></div>
                <div className="flex gap-4"><span className="text-[#565959] w-20">Sold by</span><span className="text-[#007185] cursor-pointer font-medium hover:underline">Amazon.com</span></div>
                <div className="flex gap-4"><span className="text-[#565959] w-20">Returns</span><span className="text-[#007185] cursor-pointer hover:underline">Eligible for Return, Refund or Replacement within 30 days of receipt</span></div>
                <div className="flex gap-4"><span className="text-[#565959] w-20">Payment</span><span className="text-[#007185] cursor-pointer hover:underline">Secure transaction</span></div>
                <div className="flex items-center gap-2 text-[#007185] hover:text-[#c45500] hover:underline cursor-pointer mt-4 font-bold border-t pt-2">
                  <Lock size={14} className="text-gray-400" />
                  <span>Secure transaction</span>
                </div>
              </div>
              <button className="w-full border border-gray-300 rounded-lg py-1 text-sm font-medium hover:bg-gray-100 bg-white">Add to List</button>
            </div>
          </div>
        </div>

        {/* Feature Icons Section */}
        <div className="mt-12 flex justify-between gap-4 py-8 border-y overflow-x-auto no-scrollbar">
            {[
              { icon: RotateCcw, label: '30-day return policy' },
              { icon: Truck, label: 'Amazon Delivered' },
              { icon: ShieldCheck, label: 'Secure transaction' },
              { icon: ImageIcon, label: 'Brand Direct' },
              { icon: MessageSquare, label: 'Customer Support' }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2 min-w-[120px]">
                <f.icon className="text-[#565959]" size={32} />
                <p className="text-[11px] font-bold text-[#007185] hover:underline cursor-pointer leading-tight">{f.label}</p>
              </div>
            ))}
        </div>

        {/* Frequently Bought Together */}
        {frequentlyBoughtTogether.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Frequently bought together</h2>
            <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
               <div className="flex items-center gap-3 flex-wrap justify-center">
                  <div className="w-24 h-24 bg-white border rounded p-1"><img src={product.images?.[0]} className="w-full h-full object-contain" onError={handleImageError} /></div>
                  {frequentlyBoughtTogether.map(p => (
                    <React.Fragment key={p.id}>
                      <Plus className="text-gray-400" size={20} />
                      <div className="w-24 h-24 bg-white border rounded p-1 cursor-pointer hover:shadow-md" onClick={() => onProductSelect(p)}>
                        <img src={p.images?.[0]} className="w-full h-full object-contain" onError={handleImageError} />
                      </div>
                    </React.Fragment>
                  ))}
               </div>
               <div className="space-y-2 text-center md:text-left flex-1">
                  <p className="text-sm font-medium">Total price: <span className="text-[#B12704] text-lg font-bold">${(Number(product.price || 0) + frequentlyBoughtTogether.reduce((a,b) => a + Number(b.price || 0), 0)).toFixed(2)}</span></p>
                  <button className="bg-[#ffd814] hover:bg-[#f7ca00] text-black px-8 py-1.5 rounded-lg text-xs font-medium border border-[#fcd200] shadow-sm">Add all items to Cart</button>
               </div>
            </div>
          </div>
        )}

        {/* Technical Details Table */}
        <div className="mt-12 border-t pt-8">
           <h2 className="text-xl font-bold mb-6">Product information</h2>
           <div className="grid md:grid-cols-2 gap-x-12">
              <div>
                <h4 className="font-bold text-sm mb-4 border-b pb-1">Technical Details</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs border-b">
                   <div className="bg-gray-50 p-2 font-bold border-r">Brand</div>
                   <div className="p-2">{product.brand_info?.split('\n')[0] || 'Official'}</div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Product Dimensions</div>
                   <div className="p-2">1.57 x 1.73 x 2.13 inches</div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Item Weight</div>
                   <div className="p-2">1.5 ounces</div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Model Number</div>
                   <div className="p-2 uppercase">AZ-{product.id}-XF</div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Batteries Required</div>
                   <div className="p-2">No</div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Manufacturer</div>
                   <div className="p-2">Amazon Global Store</div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-4 border-b pb-1">Additional Information</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs border-b">
                   <div className="bg-gray-50 p-2 font-bold border-r">ASIN</div>
                   <div className="p-2 font-mono text-[10px] uppercase">B0{product.id}AMZNST</div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Customer Reviews</div>
                   <div className="p-2 flex items-center gap-1">
                      <StarRating rating={averageRating} size={12} />
                      <span className="text-[#007185] hover:underline cursor-pointer">{currentReviews.length} ratings</span>
                   </div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Best Sellers Rank</div>
                   <div className="p-2">#1 in <span className="text-[#007185] hover:underline cursor-pointer">{product.category || 'Featured'}</span></div>
                   <div className="bg-gray-50 p-2 font-bold border-r">Date First Available</div>
                   <div className="p-2">October 12, 2023</div>
                </div>
              </div>
           </div>
        </div>

        {/* Comparison Table */}
        {comparisonProducts.length > 0 && (
          <div className="mt-16 overflow-x-auto no-scrollbar">
            <h2 className="text-xl font-bold mb-6">Compare with similar items</h2>
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-4 bg-gray-50 text-left w-40">Feature</th>
                  <th className="p-4 text-center border-l bg-orange-50/20 w-48">This item</th>
                  {comparisonProducts.map(p => (
                    <th key={p.id} className="p-4 text-center border-l hover:bg-gray-50 cursor-pointer w-48 align-top" onClick={() => onProductSelect(p)}>
                      <p className="line-clamp-2 text-[#007185] font-medium mb-2">{p.title}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Image</td>
                  <td className="p-4 text-center border-l"><img src={product.images?.[0]} className="h-24 mx-auto object-contain" onError={handleImageError} /></td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l"><img src={p.images?.[0]} className="h-24 mx-auto object-contain" onError={handleImageError} /></td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Customer Rating</td>
                  <td className="p-4 text-center border-l flex flex-col items-center gap-1">
                     <StarRating rating={averageRating} size={14} />
                     <span className="text-xs text-[#007185]">({currentReviews.length})</span>
                  </td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l">
                       <div className="flex flex-col items-center gap-1">
                         <StarRating rating={p.rating || 4.2} size={14} />
                         <span className="text-xs text-[#007185]">({formatNumber(p.reviews_count || 45)})</span>
                       </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Price</td>
                  <td className="p-4 text-center border-l text-[#B12704] font-bold text-lg">${Number(product.price || 0).toFixed(2)}</td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l text-lg font-medium">${Number(p.price || 0).toFixed(2)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 bg-gray-50 font-bold">Shipping</td>
                  <td className="p-4 text-center border-l text-[#007600] font-bold">FREE Shipping</td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-4 text-center border-l text-gray-500">Shipping included</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16 border-t pt-16 grid lg:grid-cols-12 gap-16">
           <div className="lg:col-span-4 sticky top-28 h-fit">
              <h2 className="text-2xl font-bold mb-2">Customer reviews</h2>
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={averageRating} size={24} />
                <span className="font-bold text-xl">{averageRating.toFixed(1)} out of 5</span>
              </div>
              <p className="text-sm text-[#565959] mb-8">{formatNumber(currentReviews.length)} global ratings</p>
              
              <ReviewDistribution reviews={currentReviews} />
              
              <div className="border-t pt-8 space-y-4">
                 <h3 className="font-bold text-lg">Review this product</h3>
                 <p className="text-sm text-gray-600">Share your thoughts with other customers</p>
                 <button className="w-full border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-[0.98]">Write a customer review</button>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-12">
              <h3 className="text-xl font-bold flex items-center justify-between">
                 Top reviews from the United States
                 <div className="flex items-center gap-2 text-sm font-normal text-[#565959] border rounded-lg px-3 py-1 bg-white hover:bg-gray-50 cursor-pointer">
                    Sort by: Top reviews <ChevronDown size={14} />
                 </div>
              </h3>
              
              {loadingReviews ? (
                <div className="flex flex-col items-center gap-4 py-20 text-gray-400">
                  <Loader2 className="animate-spin" size={48} />
                  <p className="font-medium animate-pulse">Reading the community feedback...</p>
                </div>
              ) : currentReviews.length === 0 ? (
                <div className="bg-gray-50 p-12 rounded-xl text-center border border-dashed border-gray-300">
                   <p className="text-gray-400 italic font-medium">Be the first to share your experience with this product.</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {currentReviews.map((review: any) => (
                    <div key={review.id} className="space-y-3 pb-8 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#f0f2f2] rounded-full w-9 h-9 flex items-center justify-center border border-gray-100">
                          <User size={22} className="text-[#a7abb1]" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{review.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size={18} />
                        <span className="text-sm font-bold truncate max-w-sm">{review.comment?.substring(0, 55)}...</span>
                      </div>
                      <p className="text-xs text-[#565959]">Reviewed in the United States on {review.date}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-[#c45500]">Verified Purchase</span>
                         <span className="text-xs text-gray-300">|</span>
                         <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Vine Voice</span>
                      </div>
                      <p className="text-sm leading-relaxed text-[#0f1111] whitespace-pre-wrap mt-2">{review.comment}</p>
                      <div className="flex items-center gap-4 mt-6">
                         <button className="px-10 py-1.5 border border-gray-300 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 bg-white transition-all active:ring-2 active:ring-orange-100">Helpful</button>
                         <span className="text-xs text-[#565959] border-l pl-4 cursor-pointer hover:underline">Report</span>
                      </div>
                    </div>
                  ))}
                  <button className="text-[#007185] hover:text-[#c45500] hover:underline font-bold flex items-center gap-2 text-sm pt-4">
                     See more reviews from the United States <ChevronRight size={16} />
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin & Global Views ---

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
          <h1 className="text-xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}><Settings size={22} /> Amazon Dashboard</h1>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('products')} className={`px-4 py-1 rounded-full text-sm font-medium ${activeTab === 'products' ? 'bg-white text-black' : 'hover:bg-white/10'}`}>Products</button>
            <button onClick={() => setActiveTab('home')} className={`px-4 py-1 rounded-full text-sm font-medium ${activeTab === 'home' ? 'bg-white text-black' : 'hover:bg-white/10'}`}>Assets</button>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"><LogOut size={18} /> Exit</button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 text-[#0f1111]">
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Catalog Management</h2>
              <button onClick={() => setEditingProduct({ id: 0, title: '', price: 0, reviews_count: 0, images: [''], description: '', features: '', brand_info: '', product_info: '', buy_now_url: '', customerReviews: [] })} className="bg-[#f0c14b] px-6 py-2.5 rounded-lg font-black border border-[#a88734] hover:bg-[#e2b13c] shadow-md transition-all active:scale-95 text-sm uppercase">Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase">Preview</th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('title')}>
                      <div className="flex items-center gap-1">Product Title {getSortIcon('title')}</div>
                    </th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase cursor-pointer" onClick={() => requestSort('price')}>
                      <div className="flex items-center gap-1">Price {getSortIcon('price')}</div>
                    </th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50/80 transition-colors group">
                      <td className="p-4"><img src={p.images?.[0] || ''} className="w-12 h-12 object-contain bg-white border-2 border-gray-100 rounded-lg group-hover:scale-110 transition-transform" onError={handleImageError} /></td>
                      <td className="p-4 font-bold text-gray-900 text-sm">{p.title?.substring(0, 60)}...</td>
                      <td className="p-4 font-black text-green-700 text-sm">${Number(p.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingProduct({...p})} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
                          <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8 border-b pb-6">
                <h3 className="text-3xl font-black text-gray-800 tracking-tighter">{editingProduct.id === 0 ? 'Create New Entry' : 'Refine Product'}</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={32} /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Header Title</label>
                  <input className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-400 focus:bg-white outline-none transition-all" value={editingProduct.title || ''} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price Tag ($)</label>
                    <input type="number" step="0.01" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-400 focus:bg-white outline-none transition-all font-bold text-green-700" value={editingProduct.price || 0} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Store Department</label>
                    <input className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-400 focus:bg-white outline-none transition-all" value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} placeholder="e.g. Smart Home" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Visual Assets (One URL per line)</label>
                  <textarea className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl h-28 font-mono text-xs focus:border-blue-400 focus:bg-white outline-none transition-all" value={editingProduct.images?.join('\n') || ''} onChange={e => setEditingProduct({...editingProduct, images: e.target.value.split('\n')})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Feature Highlights (Bullet Points)</label>
                  <textarea className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl h-40 focus:border-blue-400 focus:bg-white outline-none transition-all text-sm leading-relaxed" value={editingProduct.features || ''} onChange={e => setEditingProduct({...editingProduct, features: e.target.value})} placeholder="Bullet point features..." />
                </div>
                <div className="flex gap-4 pt-6 border-t">
                  <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase text-sm tracking-widest">Discard</button>
                  <button onClick={() => { onSaveProduct(editingProduct); setEditingProduct(null); }} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all uppercase text-sm tracking-widest">Publish Changes</button>
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
    <div className="min-h-screen bg-white flex flex-col items-center pt-24">
      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="h-10 mb-12 cursor-pointer" onClick={onCancel} />
      <div className="w-[400px] border border-gray-300 rounded-2xl p-10 shadow-xl bg-white">
        <h1 className="text-3xl font-black text-gray-800 mb-8 tracking-tighter">Admin Portal</h1>
        <form onSubmit={e => { e.preventDefault(); onLogin(u, p); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Credential ID</label>
            <input className="w-full border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all" value={u} onChange={e => setU(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Security Key</label>
            <input type="password" className="w-full border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all" value={p} onChange={e => setP(e.target.value)} required />
          </div>
          <button className="w-full bg-[#f0c14b] py-4 rounded-2xl font-black border-2 border-[#a88734] shadow-lg shadow-orange-100 hover:bg-[#e2b13c] transition-all active:scale-95 uppercase text-sm tracking-widest">Establish Link</button>
        </form>
        <button onClick={onCancel} className="w-full mt-8 text-sm text-blue-600 hover:text-orange-600 font-bold transition-colors">Return to Marketplace</button>
      </div>
    </div>
  );
};

const Footer = ({ setView }: any) => (
  <footer className="mt-auto">
    <button 
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="w-full bg-[#37475a] hover:bg-[#485769] text-white py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2"
    >
      <ChevronUp size={20} /> Back to top
    </button>
    <div className="bg-[#232f3e] text-white py-16">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-16 px-8">
        <div className="space-y-4">
          <h4 className="font-black text-lg tracking-tight uppercase text-gray-200">Get to Know Us</h4>
          <ul className="text-sm text-gray-400 space-y-3 cursor-pointer">
            <li className="hover:text-white hover:underline transition-colors">Careers</li>
            <li className="hover:text-white hover:underline transition-colors">Blog</li>
            <li className="hover:text-white hover:underline transition-colors">About Marketplace</li>
            <li className="hover:text-white hover:underline transition-colors">Sustainability</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-black text-lg tracking-tight uppercase text-gray-200">Merchant Hub</h4>
          <ul className="text-sm text-gray-400 space-y-3 cursor-pointer">
            <li className="hover:text-white hover:underline transition-colors">Sell with Us</li>
            <li className="hover:text-white hover:underline transition-colors">Become a Partner</li>
            <li className="hover:text-white hover:underline transition-colors">Merchant Branding</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-black text-lg tracking-tight uppercase text-gray-200">Financials</h4>
          <ul className="text-sm text-gray-400 space-y-3 cursor-pointer">
            <li className="hover:text-white hover:underline transition-colors">Amazon Store Card</li>
            <li className="hover:text-white hover:underline transition-colors">Points Rewards</li>
            <li className="hover:text-white hover:underline transition-colors">Currency Exchange</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-black text-lg tracking-tight uppercase text-gray-200">Support</h4>
          <ul className="text-sm text-gray-400 space-y-3 cursor-pointer">
            <li className="hover:text-white hover:underline transition-colors">Secure Account</li>
            <li className="hover:text-white hover:underline transition-colors">Track Orders</li>
            <li className="hover:text-white hover:underline transition-colors">Replacements</li>
            <li className="hover:text-white hover:underline transition-colors">Help Center</li>
          </ul>
        </div>
      </div>
      <div className="mt-20 pt-16 border-t border-gray-700/50 text-center px-8">
        <img src="https://pngimg.com/uploads/amazon/amazon_PNG11.png" className="h-10 mx-auto mb-8 opacity-60 cursor-pointer grayscale hover:grayscale-0 transition-all" onClick={() => setView('home')} />
        <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 mb-6 font-medium">
          <span className="hover:underline cursor-pointer">Conditions of Use</span>
          <span className="hover:underline cursor-pointer">Privacy Notice</span>
          <span className="hover:underline cursor-pointer">Your Ads Privacy Choices</span>
        </div>
        <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">© 1996-2024, High Fidelity Storefront. Simulated Experience.</p>
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
      const formattedProducts = (pData || []).map((p: any) => ({ 
        ...p, 
        customerReviews: Array.isArray(p.reviews) ? p.reviews : [] 
      }));
      setProducts(formattedProducts);

      const { data: cData, error: cError } = await supabase.from('site_config').select('*');
      if (!cError && cData && Array.isArray(cData)) {
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
    } catch (err) { 
      console.error("Fetch Data Failed:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSaveProduct = async (p: any) => {
    const { id, customerReviews, reviews, ...productData } = p;
    let productId = id;
    try {
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
        })).filter((r: any) => r.comment && r.comment.trim());
        if (reviewsToInsert.length > 0) await supabase.from('reviews').insert(reviewsToInsert);
      }
      await fetchData();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const onDeleteProduct = async (id: number) => {
    if (window.confirm("Delete this product permanently?")) {
      try {
        await supabase.from('products').delete().eq('id', id);
        await fetchData();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleLogin = (u: string, p: string) => {
    if (u === '@Amazon project' && p === '@Amazon project123') setView('admin');
    else alert("Credentials do not match our records.");
  };

  const filteredProducts = products.filter(p => p && p.title && p.title.toLowerCase().includes((searchTerm || '').toLowerCase()));

  if (loading && view === 'home' && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#eaeded] animate-pulse">
        <Loader2 className="animate-spin text-[#232f3e] mb-6" size={60} strokeWidth={1} />
        <p className="font-black text-[#232f3e] tracking-widest uppercase text-xs">Synchronizing Storefront...</p>
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
          <div className="pb-20">
            <div className="relative h-[250px] md:h-[650px] overflow-hidden">
               <img src={heroes?.[0] || "https://m.media-amazon.com/images/I/71Ie3JXGfVL._SX3000_.jpg"} className="w-full h-full object-cover" onError={handleImageError} />
               <div className="absolute inset-0 hero-gradient"></div>
            </div>
            <div className="max-w-[1500px] mx-auto px-4 mt-[-120px] md:mt-[-420px] relative z-10 space-y-8">
               <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {(categories || []).map((cat, idx) => (
                    <div key={idx} className="bg-white p-6 flex flex-col h-full shadow-2xl rounded-sm hover:translate-y-[-4px] transition-all">
                      <h2 className="text-xl font-bold mb-4 tracking-tight">{cat.title}</h2>
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        {(cat.items || []).map((item, i) => (
                          <div key={i} className="flex flex-col cursor-pointer group">
                            <div className="h-28 flex items-center justify-center overflow-hidden mb-2 bg-gray-50/50 rounded p-2">
                              <img src={item.image} alt={item.label} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500" onError={handleImageError} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-600 group-hover:text-black transition-colors">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <a href="#" className="text-xs text-[#007185] hover:text-[#c45500] hover:underline mt-6 font-black uppercase tracking-tighter">Shop the Collection</a>
                    </div>
                  ))}
               </div>
               
               {/* Trending Section */}
               <div className="bg-white p-8 shadow-xl rounded-sm min-h-[500px]">
                  <div className="flex items-center justify-between mb-8 border-b pb-4">
                    <h2 className="text-2xl font-black tracking-tighter">Top Trending Releases</h2>
                    <a href="#" className="text-sm text-[#007185] hover:text-[#c45500] hover:underline font-bold">Discover All Deals</a>
                  </div>
                  <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="cursor-pointer hover:shadow-2xl transition-all border border-gray-100 p-5 rounded-sm bg-white flex flex-col group relative" onClick={() => onProductSelect(p)}>
                         <div className="h-56 w-full flex items-center justify-center mb-6 p-4 overflow-hidden">
                          <img src={p.images?.[0] || ''} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" onError={handleImageError} />
                         </div>
                         <div className="space-y-2 flex-1 flex flex-col">
                            <h3 className="text-sm font-medium line-clamp-2 h-10 text-[#007185] group-hover:text-[#c45500] group-hover:underline leading-snug">{p.title}</h3>
                            <div className="flex text-[#ffa41c] items-center gap-1.5 pt-1">
                               <StarRating rating={p.rating || 4.5} size={14} />
                               <span className="text-xs text-[#007185] font-medium hover:underline">{formatNumber(p.reviews_count || 0)}</span>
                            </div>
                            <div className="mt-auto pt-4 space-y-1">
                               <div className="flex items-start">
                                  <span className="text-xs font-bold mt-1.5 text-gray-700">$</span>
                                  <p className="text-2xl font-black tracking-tighter">{Math.floor(Number(p.price || 0))}<span className="text-xs align-top font-bold">{(Number(p.price || 0) % 1).toFixed(2).substring(2)}</span></p>
                               </div>
                               <div className="flex items-center gap-1.5">
                                 <img src="https://m.media-amazon.com/images/G/01/prime/marketing/slashPrime/amazon-prime-delivery-checkmark._CB611054930_.png" alt="Prime" className="h-3.5" />
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter"><span className="text-[#007600]">FREE delivery</span> Tomorrow</p>
                               </div>
                            </div>
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
          <div className="min-h-[85vh] p-4 md:p-12">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <div className="lg:col-span-3 bg-white p-8 rounded shadow-2xl border border-gray-100">
                <h1 className="text-3xl font-black tracking-tighter border-b-2 border-gray-50 pb-6 mb-8 uppercase text-gray-800">Your Basket</h1>
                {cartCount === 0 ? (
                  <div className="py-24 text-center space-y-6">
                    <ShoppingCart size={80} className="mx-auto text-gray-200" strokeWidth={1} />
                    <p className="text-2xl text-gray-400 font-black tracking-tighter italic">The marketplace is waiting for your selections.</p>
                    <button onClick={goHome} className="bg-[#f0c14b] px-12 py-3 rounded-2xl font-black border-2 border-[#a88734] shadow-lg hover:bg-[#e2b13c] transition-all uppercase tracking-widest text-sm">Return to Shop</button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-8 border-b border-gray-50 pb-10 last:border-0 group">
                        <div className="w-48 h-48 flex-shrink-0 flex items-center justify-center cursor-pointer bg-white border border-gray-100 rounded-xl p-4 group-hover:shadow-lg transition-all" onClick={() => onProductSelect(item)}>
                           <img src={item.images?.[0] || ''} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" onError={handleImageError} />
                        </div>
                        <div className="flex-1 space-y-3">
                          <h3 className="text-xl font-bold hover:text-[#c45500] hover:underline cursor-pointer leading-snug" onClick={() => onProductSelect(item)}>{item.title}</h3>
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-bold text-[#007600] bg-green-50 px-2 py-0.5 rounded">In Stock</span>
                             <span className="text-xs text-gray-400 font-medium italic">Sold & Fulfilled by Marketplace</span>
                          </div>
                          <div className="flex items-center gap-6 mt-6">
                            <button onClick={() => setCart(c => c.filter((_, i) => i !== idx))} className="text-xs text-[#007185] hover:text-[#c45500] hover:underline font-bold">Remove Item</button>
                            <span className="text-gray-200">|</span>
                            <button className="text-xs text-[#007185] hover:text-[#c45500] hover:underline font-bold">Save for Later</button>
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                           <span className="font-black text-2xl text-gray-900 tracking-tighter">${Number(item.price || 0).toFixed(2)}</span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">+ Tax & Duties</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cartCount > 0 && (
                <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 space-y-6 sticky top-24">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Valuation</p>
                    <div className="text-3xl font-black tracking-tighter leading-tight">Subtotal ({cartCount} items): <span className="text-gray-900">${cartSubtotal.toFixed(2)}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-[#007600] font-bold text-sm bg-green-50 p-2 rounded-lg">
                    <Check size={18} />
                    <span>Your order qualifies for FREE Shipping</span>
                  </div>
                  <button onClick={() => { if(window.confirm("Authorize this transaction?")) { setCart([]); setView('home'); alert("Transaction Successful. Order #HFX-9238-129 confirmed."); } }} className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black rounded-2xl py-4 font-black text-sm border-2 border-[#fcd200] shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest">Authorize Checkout</button>
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
