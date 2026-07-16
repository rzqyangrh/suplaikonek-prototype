import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  FileText,
  Package,
  Briefcase,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIG ---
// PENTING: URL & anon/publishable key TIDAK di-hardcode di source code.
// Keduanya diambil dari environment variable (file .env, tidak di-commit ke git).
//
// Jika project ini pakai Vite   -> buat file .env berisi:
//   VITE_SUPABASE_URL=https://qbbvqepdszuoakoovuzm.supabase.co
//   VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx
//
// Jika project ini pakai Create React App -> gunakan prefix REACT_APP_ dan
// ganti baris di bawah menjadi process.env.REACT_APP_SUPABASE_URL, dst.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Supabase URL/Key tidak ditemukan. Pastikan file .env sudah diisi (lihat komentar di atas).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- DEFAULT / FALLBACK SHAPE (dipakai selama data dari Supabase belum dimuat) ---
const emptyDB = {
  settings: {},
  products: [],
  services: [],
  articles: [],
  categories: [],
};

// Data ini HANYA dipakai sebagai referensi struktur & untuk seeding awal ke Supabase,
// bukan lagi menjadi sumber data aplikasi.
const initialDB = {
  settings: {
    companyName: 'SuplaiKonek',
    tagline: 'One Stop Solution for Procurement',
    whatsapp: '6281234567890',
    email: 'halo@suplaikonek.com',
    address: 'Jl. Jend. Sudirman No. Kav 1, Jakarta Selatan',
    heroTitle: 'Simplify Your Corporate Procurement Process',
    heroSubtitle:
      'We provide comprehensive procurement solutions for ATK, IT Equipment, Furniture, and Industrial Needs with fast delivery and competitive pricing.',
    aboutText:
      'SuplaiKonek is a trusted procurement partner for businesses, government institutions, and commercial offices across Indonesia. We focus on transparency, speed, and quality.',
    primaryColor: 'blue-600',
  },
  products: [
    {
      id: '1',
      name: 'MacBook Pro 16" M3 Max',
      category: 'Office IT Equipment',
      brand: 'Apple',
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      description:
        'High-performance laptop for demanding professional workflows.',
    },
    {
      id: '2',
      name: 'Ergonomic Mesh Chair V2',
      category: 'Furniture',
      brand: 'ErgoTech',
      image:
        'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=400&q=80',
      description: 'Premium ergonomic office chair for 8+ hours comfort.',
    },
    {
      id: '3',
      name: 'Premium Copy Paper A4 80gsm',
      category: 'ATK',
      brand: 'PaperOne',
      image:
        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80',
      description: 'High-quality multi-purpose copy paper.',
    },
    {
      id: '4',
      name: 'Industrial Safety Helmet',
      category: 'Safety Equipment',
      brand: 'SafePro',
      image:
        'https://images.unsplash.com/photo-1585832770485-e68a5dbfa5dc?auto=format&fit=crop&w=400&q=80',
      description: 'Standard compliant safety helmet for construction sites.',
    },
  ],
  services: [
    {
      id: '1',
      title: 'Corporate Procurement',
      description:
        'End-to-end procurement solutions for daily corporate needs, from ATK to pantry supplies.',
      icon: 'Briefcase',
    },
    {
      id: '2',
      title: 'Government Projects',
      description:
        'Compliant and transparent procurement for government institutions and BUMN.',
      icon: 'ShieldCheck',
    },
    {
      id: '3',
      title: 'Custom Sourcing',
      description:
        'Looking for specific items? Our team will source local and international vendors for you.',
      icon: 'Search',
    },
  ],
  articles: [
    {
      id: '1',
      title: 'Cara Memilih Vendor ATK Terpercaya untuk Perusahaan',
      slug: 'cara-memilih-vendor-atk',
      date: '2026-07-10',
      excerpt:
        'Memilih vendor ATK yang tepat dapat menghemat anggaran operasional hingga 20%. Berikut tipsnya.',
      content: 'Full content here...',
    },
    {
      id: '2',
      title: 'Tren Pengadaan Barang IT Kantor di Tahun 2026',
      slug: 'tren-pengadaan-it-2026',
      date: '2026-07-12',
      excerpt:
        'Mulai dari AI-ready laptops hingga infrastruktur cloud, ketahui apa yang dibutuhkan kantor modern.',
      content: 'Full content here...',
    },
  ],
  categories: [
    'ATK',
    'Office IT Equipment',
    'Furniture',
    'Pantry',
    'Safety Equipment',
    'Industrial Supplies',
    'Custom',
  ],
};

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [db, setDb] = useState(emptyDB);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState('/'); // '/', '/products', '/admin', etc.

  // --- AUTH: cek session yang sedang aktif & dengarkan perubahan login/logout ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInAdmin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) setSession(data.session);
    return { error };
  };

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentRoute('/');
  };

  // Mengambil semua data dari Supabase
  const fetchAll = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [
        settingsRes,
        productsRes,
        servicesRes,
        articlesRes,
        categoriesRes,
      ] = await Promise.all([
        supabase.from('settings').select('*').limit(1).maybeSingle(),
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('services').select('*'),
        supabase
          .from('articles')
          .select('*')
          .order('date', { ascending: false }),
        supabase.from('categories').select('*'),
      ]);

      const firstError =
        settingsRes.error ||
        productsRes.error ||
        servicesRes.error ||
        articlesRes.error ||
        categoriesRes.error;

      if (firstError) throw firstError;

      setDb({
        settings: settingsRes.data || {},
        products: productsRes.data || [],
        services: servicesRes.data || [],
        articles: articlesRes.data || [],
        categories: (categoriesRes.data || []).map((c) => c.name),
      });
    } catch (err) {
      console.error('Gagal memuat data dari Supabase:', err);
      setLoadError(err.message || 'Gagal memuat data dari Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- CRUD via Supabase ---
  const updateSettings = async (newSettings) => {
    if (!db.settings?.id) {
      console.error('Tidak ada row settings untuk diupdate.');
      return;
    }
    const { data, error } = await supabase
      .from('settings')
      .update(newSettings)
      .eq('id', db.settings.id)
      .select()
      .single();

    if (error) {
      console.error('Gagal update settings:', error);
      return;
    }
    setDb((prev) => ({ ...prev, settings: data }));
  };

  const addRecord = async (table, record) => {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error(`Gagal menambah data ke ${table}:`, error);
      return;
    }
    setDb((prev) => ({
      ...prev,
      [table]: [data, ...prev[table]],
    }));
  };

  const updateRecord = async (table, id, updatedRecord) => {
    const { data, error } = await supabase
      .from(table)
      .update(updatedRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Gagal update data di ${table}:`, error);
      return;
    }
    setDb((prev) => ({
      ...prev,
      [table]: prev[table].map((item) => (item.id === id ? data : item)),
    }));
  };

  const deleteRecord = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      console.error(`Gagal menghapus data di ${table}:`, error);
      return;
    }
    setDb((prev) => ({
      ...prev,
      [table]: prev[table].filter((item) => item.id !== id),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        db,
        isLoading,
        loadError,
        refetch: fetchAll,
        updateSettings,
        addRecord,
        updateRecord,
        deleteRecord,
        isAdminAuth: !!session,
        authLoading,
        adminEmail: session?.user?.email || null,
        signInAdmin,
        signOutAdmin,
        currentRoute,
        setCurrentRoute,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// --- UI COMPONENTS ---
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline:
      'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500',
    whatsapp:
      'bg-[#25D366] text-white hover:bg-[#128C7E] focus:ring-[#25D366] shadow-md',
  };

  return (
    <button
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', ...props }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      type={type}
      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
      {...props}
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col space-y-1.5 w-full">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    <textarea
      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full min-h-[100px]"
      {...props}
    />
  </div>
);

// --- PUBLIC FRONTEND COMPONENTS ---
const Navbar = () => {
  const { db, currentRoute, setCurrentRoute } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Services', path: '/services' },
    { name: 'Articles', path: '/articles' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setCurrentRoute('/')}
          >
            <div className="flex-shrink-0 flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-2xl text-gray-900 tracking-tight">
                {db.settings.companyName}
              </span>
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => setCurrentRoute(link.path)}
                className={`text-sm font-medium transition-colors ${
                  currentRoute === link.path
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.name}
              </button>
            ))}
            <Button
              variant="primary"
              onClick={() =>
                window.open(
                  `https://wa.me/${db.settings.whatsapp}?text=Hello ${db.settings.companyName}, I need assistance with procurement.`,
                  '_blank'
                )
              }
            >
              Contact Sales
            </Button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  setCurrentRoute(link.path);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  const { db, setCurrentRoute } = useContext(AppContext);
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-8 w-8 text-blue-400" />
              <span className="font-bold text-2xl tracking-tight">
                {db.settings.companyName}
              </span>
            </div>
            <p className="text-gray-400 max-w-md mb-6">{db.settings.tagline}</p>
            <div className="flex flex-col space-y-2 text-gray-300 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {db.settings.address}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +{db.settings.whatsapp}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {db.settings.email}
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <button
                  onClick={() => setCurrentRoute('/products')}
                  className="hover:text-white"
                >
                  Our Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentRoute('/services')}
                  className="hover:text-white"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentRoute('/articles')}
                  className="hover:text-white"
                >
                  Procurement Blog
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Admin Area</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <button
                  onClick={() => setCurrentRoute('/admin')}
                  className="hover:text-white flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" /> CMS Login
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} {db.settings.companyName}. All
            rights reserved.
          </p>
          <p>Demo Prototype built with React</p>
        </div>
      </div>
    </footer>
  );
};

const WhatsAppFloat = () => {
  const { db } = useContext(AppContext);
  return (
    <a
      href={`https://wa.me/${db.settings.whatsapp}?text=Hello ${db.settings.companyName}, I'm interested in your procurement services.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group"
    >
      <MessageCircle className="h-8 w-8" />
      <span className="absolute right-16 bg-white text-gray-800 text-sm font-medium py-1.5 px-3 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Chat with Sales
      </span>
    </a>
  );
};

// --- PUBLIC PAGES ---
const HomePage = () => {
  const { db, setCurrentRoute } = useContext(AppContext);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 inline-block bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-200">
            {db.settings.tagline}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            {db.settings.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {db.settings.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setCurrentRoute('/products')}>
              Browse Products
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentRoute('/services')}
            >
              Our Services
            </Button>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Corporate Clients', value: '500+' },
              { label: 'Products Delivered', value: '1M+' },
              { label: 'Cities Covered', value: '50+' },
              { label: 'Satisfaction Rate', value: '99%' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Categories
              </h2>
              <p className="text-gray-600 max-w-2xl">
                Discover our top-tier products trusted by leading companies.
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden sm:flex"
              onClick={() => setCurrentRoute('/products')}
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {db.products.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-gray-700">
                    {product.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 truncate">
                    {product.brand}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${db.settings.whatsapp}?text=I want to inquire about ${product.name}`,
                        '_blank'
                      )
                    }
                  >
                    Inquire via WA
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose {db.settings.companyName}?
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {db.settings.aboutText}
              </p>
              <ul className="space-y-4">
                {[
                  'Dedicated Account Manager',
                  'Transparent Pricing & Billing',
                  'Nationwide Fast Delivery',
                  'Quality Guarantee on all items',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
                alt="Office Warehouse"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-blue-600/10"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductsPage = () => {
  const { db } = useContext(AppContext);
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts =
    activeCategory === 'All'
      ? db.products
      : db.products.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Product Catalog
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our comprehensive range of procurement items tailored for
            your business needs.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <Button
            variant={activeCategory === 'All' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveCategory('All')}
            className="rounded-full"
          >
            All Products
          </Button>
          {db.categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gray-100 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <div className="text-xs font-semibold text-blue-600 uppercase mb-1">
                  {product.category}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 flex-grow">
                  {product.description}
                </p>
                <Button
                  variant="whatsapp"
                  className="w-full mt-auto"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${db.settings.whatsapp}?text=I want to inquire about ${product.name} (${product.category})`,
                      '_blank'
                    )
                  }
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Ask for Quote
                </Button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              No products found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const serviceIconMap = {
  Briefcase,
  ShieldCheck,
  Search,
  TrendingUp,
  Truck,
  Users,
  Package,
  FileText,
  Settings,
};

const ServicesPage = () => {
  const { db } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Solusi pengadaan menyeluruh yang dirancang untuk kebutuhan bisnis,
            pemerintahan, dan korporasi Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {db.services.map((service) => {
            const Icon = serviceIconMap[service.icon] || Briefcase;
            return (
              <div
                key={service.id}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
          {db.services.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              Belum ada layanan yang ditambahkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticlesPage = () => {
  const { db, setCurrentRoute } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Procurement Blog
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Artikel dan tips seputar dunia procurement, dari pemilihan vendor
            hingga tren teknologi kantor.
          </p>
        </div>

        <div className="space-y-6">
          {db.articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-xs text-gray-400 mb-2">{article.date}</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {article.title}
              </h2>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentRoute(`/articles/${article.slug}`)}
              >
                Read More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
          {db.articles.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              Belum ada artikel yang dipublikasikan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticleDetailPage = ({ slug }) => {
  const { db, setCurrentRoute } = useContext(AppContext);
  const article = db.articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-32 text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Artikel tidak ditemukan
        </h1>
        <p className="text-gray-500 mb-6">
          Artikel dengan slug "{slug}" tidak ada di database.
        </p>
        <Button onClick={() => setCurrentRoute('/articles')}>
          Kembali ke Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setCurrentRoute('/articles')}
          className="text-sm text-blue-600 hover:underline mb-8 inline-flex items-center gap-1"
        >
          ← Kembali ke semua artikel
        </button>
        <div className="text-xs text-gray-400 mb-3">{article.date}</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {article.title}
        </h1>
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </div>
  );
};

// --- ADMIN CMS COMPONENTS ---
const Badge = ({ children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
  >
    {children}
  </span>
);

const AdminLayout = ({ children }) => {
  const { signOutAdmin, adminEmail } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Global Settings', icon: Settings },
    { id: 'products', label: 'Products Master', icon: Package },
    { id: 'articles', label: 'Articles & SEO', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <span className="font-bold text-xl flex items-center gap-2">
            <Settings className="text-blue-400" /> CMS Admin
          </span>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-1 px-3">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon className="h-5 w-5" /> {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={signOutAdmin}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-5 w-5" /> Exit to Website
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-2xl font-semibold text-gray-800 capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Logged in as <strong>{adminEmail || 'Administrator'}</strong>
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {(adminEmail || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'settings' && <AdminSettings />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'articles' && <AdminArticles />}
        </main>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { db } = useContext(AppContext);

  const stats = [
    {
      label: 'Total Products',
      value: db.products.length,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Total Articles',
      value: db.articles.length,
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Active Categories',
      value: db.categories.length,
      icon: Briefcase,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Services Configured',
      value: db.services.length,
      icon: Settings,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4"
          >
            <div className={`p-4 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Instructions</h3>
        <p className="text-gray-600 mb-4">
          Welcome to the SuplaiKonek CMS. Since this is a self-contained
          prototype, data is stored in memory to demonstrate frontend-backend
          reactivity.
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
          <li>
            Go to <strong>Global Settings</strong> to change the Company Name,
            WhatsApp number, and Hero Text. The frontend will update instantly.
          </li>
          <li>
            Manage <strong>Products</strong> to simulate adding items to the
            catalog.
          </li>
          <li>
            All changes here immediately reflect on the public website when you
            click "Exit to Website".
          </li>
        </ul>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { db, updateSettings } = useContext(AppContext);
  const [formData, setFormData] = useState(db.settings);

  useEffect(() => {
    setFormData(db.settings);
  }, [db.settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(formData);
    // Simulating save success
    const btn = document.getElementById('save-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Saved!';
    btn.classList.add('bg-green-600');
    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove('bg-green-600');
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Website Identity & Contact
        </h2>
        <p className="text-sm text-gray-500">
          Update global information used across the website.
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
          <Input
            label="WhatsApp Number (include country code, e.g. 62...)"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
          />
          <Input
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Tagline"
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 pt-4 border-t border-gray-100">
            Homepage Content
          </h3>
          <Input
            label="Hero Title"
            name="heroTitle"
            value={formData.heroTitle}
            onChange={handleChange}
          />
          <Textarea
            label="Hero Subtitle"
            name="heroSubtitle"
            value={formData.heroSubtitle}
            onChange={handleChange}
          />
          <Textarea
            label="About Us Content"
            name="aboutText"
            value={formData.aboutText}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
        <Button id="save-btn" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const { db, addRecord, updateRecord, deleteRecord } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);

  const initialForm = {
    name: '',
    category: db.categories[0],
    brand: '',
    image: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const handleOpenEdit = (product = null) => {
    if (product) {
      setCurrentEdit(product.id);
      setFormData(product);
    } else {
      setCurrentEdit(null);
      setFormData(initialForm);
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.name || !formData.image)
      return alert('Name and Image URL are required for demo purposes.');

    if (currentEdit) {
      updateRecord('products', currentEdit, formData);
    } else {
      addRecord('products', formData);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">
          {currentEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
        <div className="space-y-4 max-w-2xl">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="flex flex-col space-y-1.5 w-full">
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {db.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Brand"
            value={formData.brand}
            onChange={(e) =>
              setFormData({ ...formData, brand: e.target.value })
            }
          />
          <Input
            label="Image URL (Unsplash or direct link)"
            value={formData.image}
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.value })
            }
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave}>Save Product</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Products Catalog
          </h2>
          <p className="text-sm text-gray-500">
            Manage procurement items available on the website.
          </p>
        </div>
        <Button onClick={() => handleOpenEdit()}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Brand</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {db.products.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </td>
                <td className="p-4 text-gray-600">{item.category}</td>
                <td className="p-4 text-gray-600">{item.brand}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRecord('products', item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {db.products.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No products found. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminArticles = () => {
  const { db } = useContext(AppContext);
  // Simplified view for articles to keep the demo file manageable
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Articles & SEO Management
      </h2>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        This module allows you to create SEO-optimized articles. In a full
        implementation, this includes a Rich Text Editor (like TipTap or Quill)
        and Metadata inputs.
      </p>

      <div className="text-left max-w-2xl mx-auto border rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b text-sm font-medium text-gray-700">
          Existing Articles (Read-only demo)
        </div>
        <div className="divide-y">
          {db.articles.map((a) => (
            <div key={a.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900">{a.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Slug: /{a.slug} | Date: {a.date}
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Published</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminLogin = () => {
  const { signInAdmin } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error } = await signInAdmin(email, password);
    setIsSubmitting(false);
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          CMS Admin Login
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Access the SuplaiKonek management console.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email (Admin)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@suplaikonek.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login to Dashboard'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Akun admin dikelola lewat Supabase Authentication. Hubungi
            developer jika butuh akun baru.
          </p>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const {
    currentRoute,
    isAdminAuth,
    isLoading,
    loadError,
    refetch,
    authLoading,
  } = useContext(AppContext);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Memuat data dari Supabase...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-semibold mb-2">
            Gagal memuat data dari Supabase
          </p>
          <p className="text-sm text-gray-500 mb-6">{loadError}</p>
          <Button onClick={refetch}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  // Simple State-based Router
  if (currentRoute === '/admin') {
    return isAdminAuth ? <AdminLayout /> : <AdminLogin />;
  }

  // Public Routes
  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-900 selection:bg-blue-200">
      <Navbar />

      <main className="flex-grow">
        {currentRoute === '/' && <HomePage />}
        {currentRoute === '/products' && <ProductsPage />}
        {currentRoute === '/services' && <ServicesPage />}
        {currentRoute === '/articles' && <ArticlesPage />}
        {currentRoute.startsWith('/articles/') && (
          <ArticleDetailPage slug={currentRoute.replace('/articles/', '')} />
        )}
      </main>

      <WhatsAppFloat />
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
