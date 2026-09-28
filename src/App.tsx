
import { lazy, Suspense, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/shell/Layout';
import { AppLayout } from './components/shell/AppLayout';
import { CustomizerProvider } from './context/CustomizerContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DocumentTitle } from './hooks/useDocumentTitle';

type PageComponent = ReturnType<typeof lazy>;

const Sales = lazy(() => import('./pages/dashboards/Sales'));
const AuthComingSoon = lazy(() => import('./pages/auth/ComingSoon'));
const AuthCreatePasswordBasic = lazy(() => import('./pages/auth/CreatePasswordBasic'));
const AuthCreatePasswordCover = lazy(() => import('./pages/auth/CreatePasswordCover'));
const AuthLockScreenBasic = lazy(() => import('./pages/auth/LockScreenBasic'));
const AuthLockScreenCover = lazy(() => import('./pages/auth/LockScreenCover'));
const AuthMaintenance = lazy(() => import('./pages/auth/Maintenance'));
const AuthResetPasswordBasic = lazy(() => import('./pages/auth/ResetPasswordBasic'));
const AuthResetPasswordCover = lazy(() => import('./pages/auth/ResetPasswordCover'));
const AuthSignUpBasic = lazy(() => import('./pages/auth/SignUpBasic'));
const AuthSignUpCover = lazy(() => import('./pages/auth/SignUpCover'));
const AuthTwoStepBasic = lazy(() => import('./pages/auth/TwoStepBasic'));
const AuthTwoStepCover = lazy(() => import('./pages/auth/TwoStepCover'));
const Error401 = lazy(() => import('./pages/error/Error401'));
const Error403 = lazy(() => import('./pages/error/Error403'));
const Error404 = lazy(() => import('./pages/error/Error404'));
const Error500 = lazy(() => import('./pages/error/Error500'));
const Error503 = lazy(() => import('./pages/error/Error503'));
const PagesComingSoon = lazy(() => import('./pages/pages/ComingSoon'));
const PagesLanding = lazy(() => import('./pages/pages/Landing'));
const PagesLogout = lazy(() => import('./pages/pages/Logout'));
const SolarLogin = lazy(() => import('./pages/login/login'));
const AppsCalendar = lazy(() => import('./pages/apps/Calendar'));
const AppsChat = lazy(() => import('./pages/apps/Chat'));
const AppsContacts = lazy(() => import('./pages/apps/Contacts'));
const AppsEmail = lazy(() => import('./pages/apps/Email'));
const AppsEmailCompose = lazy(() => import('./pages/apps/EmailCompose'));
const AppsEmailSettings = lazy(() => import('./pages/apps/EmailSettings'));
const AppsFileManager = lazy(() => import('./pages/apps/FileManager'));
const AppsGallery = lazy(() => import('./pages/apps/Gallery'));
const AppsKanban = lazy(() => import('./pages/apps/Kanban'));
const AppsMediaPlayer = lazy(() => import('./pages/apps/MediaPlayer'));
const AppsNotes = lazy(() => import('./pages/apps/Notes'));
const AppsTasks = lazy(() => import('./pages/apps/Tasks'));
const AppsTodo = lazy(() => import('./pages/apps/Todo'));
const BlogBlogDetails = lazy(() => import('./pages/blog/BlogDetails'));
const BlogCreate = lazy(() => import('./pages/blog/Create'));
const BlogList = lazy(() => import('./pages/blog/List'));
const ChartsApexArea = lazy(() => import('./pages/charts/ApexArea'));
const ChartsApexBar = lazy(() => import('./pages/charts/ApexBar'));
const ChartsApexFinancial = lazy(() => import('./pages/charts/ApexFinancial'));
const ChartsApexLine = lazy(() => import('./pages/charts/ApexLine'));
const ChartsApexMixed = lazy(() => import('./pages/charts/ApexMixed'));
const ChartsApexPie = lazy(() => import('./pages/charts/ApexPie'));
const ChartsChartjs = lazy(() => import('./pages/charts/ChartJs'));
const ChartsEcharts = lazy(() => import('./pages/charts/ECharts'));
const ChartsSparklines = lazy(() => import('./pages/charts/Sparklines'));
const CrmCompanies = lazy(() => import('./pages/crm/Companies'));
const CrmContacts = lazy(() => import('./pages/crm/Contacts'));
const CrmDeals = lazy(() => import('./pages/crm/Deals'));
const CrmLeads = lazy(() => import('./pages/crm/Leads'));
const CryptoBuySell = lazy(() => import('./pages/crypto/BuySell'));
const CryptoExchange = lazy(() => import('./pages/crypto/Exchange'));
const CryptoMarketcap = lazy(() => import('./pages/crypto/Marketcap'));
const CryptoTransactions = lazy(() => import('./pages/crypto/Transactions'));
const CryptoWallet = lazy(() => import('./pages/crypto/Wallet'));
const JammuDashboard = lazy(() => import('./pages/jammu/JammuDashboard'));
const JammuAddSRT70MW = lazy(() => import('./pages/jammu/AddJammuSRT70MW'));
const JammuAddSRT70MWSingleCard = lazy(() => import('./pages/jammu/AddJammuSRT70MWSingleCard'));
const DashboardsAnalytics = lazy(() => import('./pages/dashboards/Analytics'));
const DashboardsCrm = lazy(() => import('./pages/dashboards/Crm'));
const DashboardsCrypto = lazy(() => import('./pages/dashboards/Crypto'));
const DashboardsEcommerce = lazy(() => import('./pages/dashboards/Ecommerce'));
const DashboardsFinance = lazy(() => import('./pages/dashboards/Finance'));
const DashboardsHealthcare = lazy(() => import('./pages/dashboards/Healthcare'));
const DashboardsHr = lazy(() => import('./pages/dashboards/Hr'));
const DashboardsJobs = lazy(() => import('./pages/dashboards/Jobs'));
const DashboardsLms = lazy(() => import('./pages/dashboards/Lms'));
const DashboardsNft = lazy(() => import('./pages/dashboards/Nft'));
const DashboardsPodcast = lazy(() => import('./pages/dashboards/Podcast'));
const DashboardsPos = lazy(() => import('./pages/dashboards/Pos'));
const DashboardsProjects = lazy(() => import('./pages/dashboards/Projects'));
const DashboardsSchool = lazy(() => import('./pages/dashboards/School'));
const DashboardsSocial = lazy(() => import('./pages/dashboards/Social'));
const DashboardsStocks = lazy(() => import('./pages/dashboards/Stocks'));
const DocsIndex = lazy(() => import('./pages/docs/Index'));
const EcommerceAddProduct = lazy(() => import('./pages/ecommerce/AddProduct'));
const EcommerceCart = lazy(() => import('./pages/ecommerce/Cart'));
const EcommerceCheckout = lazy(() => import('./pages/ecommerce/Checkout'));
const EcommerceCreateInvoice = lazy(() => import('./pages/ecommerce/CreateInvoice'));
const EcommerceCustomerDetails = lazy(() => import('./pages/ecommerce/CustomerDetails'));
const EcommerceCustomers = lazy(() => import('./pages/ecommerce/Customers'));
const EcommerceEditProduct = lazy(() => import('./pages/ecommerce/EditProduct'));
const EcommerceInvoiceDetails = lazy(() => import('./pages/ecommerce/InvoiceDetails'));
const EcommerceInvoices = lazy(() => import('./pages/ecommerce/Invoices'));
const EcommerceOrderDetails = lazy(() => import('./pages/ecommerce/OrderDetails'));
const EcommerceOrderSuccess = lazy(() => import('./pages/ecommerce/OrderSuccess'));
const EcommerceOrders = lazy(() => import('./pages/ecommerce/Orders'));
const EcommerceProductDetails = lazy(() => import('./pages/ecommerce/ProductDetails'));
const EcommerceProducts = lazy(() => import('./pages/ecommerce/Products'));
const EcommerceSellers = lazy(() => import('./pages/ecommerce/Sellers'));
const FormsAdvanced = lazy(() => import('./pages/forms/Advanced'));
const FormsEditor = lazy(() => import('./pages/forms/Editor'));
const FormsElements = lazy(() => import('./pages/forms/Elements'));
const FormsFileUpload = lazy(() => import('./pages/forms/FileUpload'));
const FormsFloatingLabels = lazy(() => import('./pages/forms/FloatingLabels'));
const FormsInputMasks = lazy(() => import('./pages/forms/InputMasks'));
const FormsLayouts = lazy(() => import('./pages/forms/Layouts'));
const FormsPickers = lazy(() => import('./pages/forms/Pickers'));
const FormsSelect = lazy(() => import('./pages/forms/Select'));
const FormsValidation = lazy(() => import('./pages/forms/Validation'));
const FormsWizard = lazy(() => import('./pages/forms/Wizard'));
const IconsBrands = lazy(() => import('./pages/icons/Brands'));
const IconsLine = lazy(() => import('./pages/icons/Line'));
const IconsSolid = lazy(() => import('./pages/icons/Solid'));
const IconsTabler = lazy(() => import('./pages/icons/Tabler'));
const JobsCandidateDetails = lazy(() => import('./pages/jobs/CandidateDetails'));
const JobsJobDetails = lazy(() => import('./pages/jobs/JobDetails'));
const JobsJobPost = lazy(() => import('./pages/jobs/JobPost'));
const JobsList = lazy(() => import('./pages/jobs/List'));
const JobsSearchCandidate = lazy(() => import('./pages/jobs/SearchCandidate'));
const JobsSearchCompany = lazy(() => import('./pages/jobs/SearchCompany'));
const JobsSearchJobs = lazy(() => import('./pages/jobs/SearchJobs'));
const MapsGoogle = lazy(() => import('./pages/maps/Google'));
const MapsLeaflet = lazy(() => import('./pages/maps/Leaflet'));
const NftCreateNft = lazy(() => import('./pages/nft/CreateNft'));
const NftLiveAuction = lazy(() => import('./pages/nft/LiveAuction'));
const NftMarketplace = lazy(() => import('./pages/nft/Marketplace'));
const NftNftDetails = lazy(() => import('./pages/nft/NftDetails'));
const NftWallet = lazy(() => import('./pages/nft/Wallet'));
const PagesActivityLog = lazy(() => import('./pages/pages/ActivityLog'));
const PagesBilling = lazy(() => import('./pages/pages/Billing'));
const PagesEvents = lazy(() => import('./pages/pages/Events'));
const PagesFaq = lazy(() => import('./pages/pages/Faq'));
const PagesNestedMenu = lazy(() => import('./pages/pages/NestedMenu'));
const PagesNotifications = lazy(() => import('./pages/pages/Notifications'));
const PagesPricing = lazy(() => import('./pages/pages/Pricing'));
const PagesPrivacy = lazy(() => import('./pages/pages/Privacy'));
const PagesProfile = lazy(() => import('./pages/pages/Profile'));
const PagesProfileSettings = lazy(() => import('./pages/pages/ProfileSettings'));
const PagesSearchResults = lazy(() => import('./pages/pages/SearchResults'));
const PagesStarter = lazy(() => import('./pages/pages/Starter'));
const PagesSupport = lazy(() => import('./pages/pages/Support'));
const PagesSweetAlerts = lazy(() => import('./pages/pages/SweetAlerts'));
const PagesTeam = lazy(() => import('./pages/pages/Team'));
const PagesTerms = lazy(() => import('./pages/pages/Terms'));
const PagesTestimonials = lazy(() => import('./pages/pages/Testimonials'));
const PagesTimeline = lazy(() => import('./pages/pages/Timeline'));
const PagesTour = lazy(() => import('./pages/pages/Tour'));
const ProjectsCreate = lazy(() => import('./pages/projects/Create'));
const ProjectsList = lazy(() => import('./pages/projects/List'));
const ProjectsOverview = lazy(() => import('./pages/projects/Overview'));
const TablesBasic = lazy(() => import('./pages/tables/Basic'));
const TablesDataTables = lazy(() => import('./pages/tables/DataTables'));
const TablesEditable = lazy(() => import('./pages/tables/Editable'));
const TablesGridjs = lazy(() => import('./pages/tables/Gridjs'));
const UiAccordions = lazy(() => import('./pages/ui/Accordions'));
const UiAlerts = lazy(() => import('./pages/ui/Alerts'));
const UiAvatars = lazy(() => import('./pages/ui/Avatars'));
const UiBadges = lazy(() => import('./pages/ui/Badges'));
const UiBreadcrumb = lazy(() => import('./pages/ui/Breadcrumb'));
const UiButtonGroup = lazy(() => import('./pages/ui/ButtonGroup'));
const UiButtons = lazy(() => import('./pages/ui/Buttons'));
const UiCards = lazy(() => import('./pages/ui/Cards'));
const UiCarousel = lazy(() => import('./pages/ui/Carousel'));
const UiDraggableCards = lazy(() => import('./pages/ui/DraggableCards'));
const UiDropdowns = lazy(() => import('./pages/ui/Dropdowns'));
const UiImages = lazy(() => import('./pages/ui/Images'));
const UiLinks = lazy(() => import('./pages/ui/Links'));
const UiListGroup = lazy(() => import('./pages/ui/ListGroup'));
const UiModals = lazy(() => import('./pages/ui/Modals'));
const UiNavbar = lazy(() => import('./pages/ui/Navbar'));
const UiNotifications = lazy(() => import('./pages/ui/Notifications'));
const UiOffcanvas = lazy(() => import('./pages/ui/Offcanvas'));
const UiPagination = lazy(() => import('./pages/ui/Pagination'));
const UiPopovers = lazy(() => import('./pages/ui/Popovers'));
const UiProgress = lazy(() => import('./pages/ui/Progress'));
const UiRatings = lazy(() => import('./pages/ui/Ratings'));
const UiRibbons = lazy(() => import('./pages/ui/Ribbons'));
const UiScrollspy = lazy(() => import('./pages/ui/Scrollspy'));
const UiSkeletons = lazy(() => import('./pages/ui/Skeletons'));
const UiSortable = lazy(() => import('./pages/ui/Sortable'));
const UiSpinners = lazy(() => import('./pages/ui/Spinners'));
const UiSwiper = lazy(() => import('./pages/ui/Swiper'));
const UiTabs = lazy(() => import('./pages/ui/Tabs'));
const UiToasts = lazy(() => import('./pages/ui/Toasts'));
const UiTooltips = lazy(() => import('./pages/ui/Tooltips'));
const UiTour = lazy(() => import('./pages/ui/Tour'));
const UiTypography = lazy(() => import('./pages/ui/Typography'));
const UtilitiesBorders = lazy(() => import('./pages/utilities/Borders'));
const UtilitiesBreakpoints = lazy(() => import('./pages/utilities/Breakpoints'));
const UtilitiesColors = lazy(() => import('./pages/utilities/Colors'));
const UtilitiesFlexGrid = lazy(() => import('./pages/utilities/FlexGrid'));
const UtilitiesHelpers = lazy(() => import('./pages/utilities/Helpers'));
const UtilitiesPosition = lazy(() => import('./pages/utilities/Position'));
const UtilitiesSpacing = lazy(() => import('./pages/utilities/Spacing'));
const Widgets = lazy(() => import('./pages/Widgets'));

// Standalone pages — rendered OUTSIDE the app shell (own full-viewport chrome).
const standalone: Record<string, PageComponent> = {
  'auth/coming-soon': AuthComingSoon,
  'auth/create-password-basic': AuthCreatePasswordBasic,
  'auth/create-password-cover': AuthCreatePasswordCover,
  'auth/lock-screen-basic': AuthLockScreenBasic,
  'auth/lock-screen-cover': AuthLockScreenCover,
  'auth/maintenance': AuthMaintenance,
  'auth/reset-password-basic': AuthResetPasswordBasic,
  'auth/reset-password-cover': AuthResetPasswordCover,
  'auth/sign-in-basic': SolarLogin,
  'auth/sign-in-cover': SolarLogin,
  'auth/sign-up-basic': AuthSignUpBasic,
  'auth/sign-up-cover': AuthSignUpCover,
  'auth/two-step-basic': AuthTwoStepBasic,
  'auth/two-step-cover': AuthTwoStepCover,
  'error/401': Error401,
  'error/403': Error403,
  'error/404': Error404,
  'error/500': Error500,
  'error/503': Error503,
  'pages/coming-soon': PagesComingSoon,
  'pages/landing': PagesLanding,
  'pages/logout': PagesLogout,
  'login': SolarLogin,
  'pages/login': SolarLogin,
  'auth/solar-login': SolarLogin,
  'auth/login': SolarLogin,
};

// The 13 app routes — rendered as children of <AppLayout> (full-screen app shell:
// slim app bar only, no sidebar/header/footer/breadcrumb).
const appShell: Record<string, PageComponent> = {
  'apps/calendar': AppsCalendar,
  'apps/chat': AppsChat,
  'apps/contacts': AppsContacts,
  'apps/email': AppsEmail,
  'apps/email-compose': AppsEmailCompose,
  'apps/email-settings': AppsEmailSettings,
  'apps/file-manager': AppsFileManager,
  'apps/gallery': AppsGallery,
  'apps/kanban': AppsKanban,
  'apps/media-player': AppsMediaPlayer,
  'apps/notes': AppsNotes,
  'apps/tasks': AppsTasks,
  'apps/todo': AppsTodo,
};

// Content pages — rendered as children of <Layout>.
const shell: Record<string, PageComponent> = {
  'blog/blog-details': BlogBlogDetails,
  'blog/create': BlogCreate,
  'blog/list': BlogList,
  'charts/apex-area': ChartsApexArea,
  'charts/apex-bar': ChartsApexBar,
  'charts/apex-financial': ChartsApexFinancial,
  'charts/apex-line': ChartsApexLine,
  'charts/apex-mixed': ChartsApexMixed,
  'charts/apex-pie': ChartsApexPie,
  'charts/chartjs': ChartsChartjs,
  'charts/echarts': ChartsEcharts,
  'charts/sparklines': ChartsSparklines,
  'crm/companies': CrmCompanies,
  'crm/contacts': CrmContacts,
  'crm/deals': CrmDeals,
  'crm/leads': CrmLeads,
  'crypto/buy-sell': CryptoBuySell,
  'crypto/exchange': CryptoExchange,
  'crypto/marketcap': CryptoMarketcap,
  'crypto/transactions': CryptoTransactions,
  'crypto/wallet': CryptoWallet,
  'jammu/dashboard': JammuDashboard,
  'jammu/add-srt-70mw': JammuAddSRT70MW,
  'jammu/add-srt-new': JammuAddSRT70MWSingleCard,
  'dashboards/solar-erp': JammuDashboard,
  'dashboards/erp': JammuDashboard,
  'dashboards/analytics': DashboardsAnalytics,
  'dashboards/crm': DashboardsCrm,
  'dashboards/crypto': DashboardsCrypto,
  'dashboards/ecommerce': DashboardsEcommerce,
  'dashboards/finance': DashboardsFinance,
  'dashboards/healthcare': DashboardsHealthcare,
  'dashboards/hr': DashboardsHr,
  'dashboards/jobs': DashboardsJobs,
  'dashboards/lms': DashboardsLms,
  'dashboards/nft': DashboardsNft,
  'dashboards/podcast': DashboardsPodcast,
  'dashboards/pos': DashboardsPos,
  'dashboards/projects': DashboardsProjects,
  'dashboards/school': DashboardsSchool,
  'dashboards/social': DashboardsSocial,
  'dashboards/stocks': DashboardsStocks,
  'docs/index': DocsIndex,
  'ecommerce/add-product': EcommerceAddProduct,
  'ecommerce/cart': EcommerceCart,
  'ecommerce/checkout': EcommerceCheckout,
  'ecommerce/create-invoice': EcommerceCreateInvoice,
  'ecommerce/customer-details': EcommerceCustomerDetails,
  'ecommerce/customers': EcommerceCustomers,
  'ecommerce/edit-product': EcommerceEditProduct,
  'ecommerce/invoice-details': EcommerceInvoiceDetails,
  'ecommerce/invoices': EcommerceInvoices,
  'ecommerce/order-details': EcommerceOrderDetails,
  'ecommerce/order-success': EcommerceOrderSuccess,
  'ecommerce/orders': EcommerceOrders,
  'ecommerce/product-details': EcommerceProductDetails,
  'ecommerce/products': EcommerceProducts,
  'ecommerce/sellers': EcommerceSellers,
  'forms/advanced': FormsAdvanced,
  'forms/editor': FormsEditor,
  'forms/elements': FormsElements,
  'forms/file-upload': FormsFileUpload,
  'forms/floating-labels': FormsFloatingLabels,
  'forms/input-masks': FormsInputMasks,
  'forms/layouts': FormsLayouts,
  'forms/pickers': FormsPickers,
  'forms/select': FormsSelect,
  'forms/validation': FormsValidation,
  'forms/wizard': FormsWizard,
  'icons/brands': IconsBrands,
  'icons/line': IconsLine,
  'icons/solid': IconsSolid,
  'icons/tabler': IconsTabler,
  'jobs/candidate-details': JobsCandidateDetails,
  'jobs/job-details': JobsJobDetails,
  'jobs/job-post': JobsJobPost,
  'jobs/list': JobsList,
  'jobs/search-candidate': JobsSearchCandidate,
  'jobs/search-company': JobsSearchCompany,
  'jobs/search-jobs': JobsSearchJobs,
  'maps/google': MapsGoogle,
  'maps/leaflet': MapsLeaflet,
  'nft/create-nft': NftCreateNft,
  'nft/live-auction': NftLiveAuction,
  'nft/marketplace': NftMarketplace,
  'nft/nft-details': NftNftDetails,
  'nft/wallet': NftWallet,
  'pages/activity-log': PagesActivityLog,
  'pages/billing': PagesBilling,
  'pages/events': PagesEvents,
  'pages/faq': PagesFaq,
  'pages/nested-menu': PagesNestedMenu,
  'pages/notifications': PagesNotifications,
  'pages/pricing': PagesPricing,
  'pages/privacy': PagesPrivacy,
  'pages/profile': PagesProfile,
  'pages/profile-settings': PagesProfileSettings,
  'pages/search-results': PagesSearchResults,
  'pages/starter': PagesStarter,
  'pages/support': PagesSupport,
  'pages/sweet-alerts': PagesSweetAlerts,
  'pages/team': PagesTeam,
  'pages/terms': PagesTerms,
  'pages/testimonials': PagesTestimonials,
  'pages/timeline': PagesTimeline,
  'pages/tour': PagesTour,
  'projects/create': ProjectsCreate,
  'projects/list': ProjectsList,
  'projects/overview': ProjectsOverview,
  'tables/basic': TablesBasic,
  'tables/data-tables': TablesDataTables,
  'tables/editable': TablesEditable,
  'tables/gridjs': TablesGridjs,
  'ui/accordions': UiAccordions,
  'ui/alerts': UiAlerts,
  'ui/avatars': UiAvatars,
  'ui/badges': UiBadges,
  'ui/breadcrumb': UiBreadcrumb,
  'ui/button-group': UiButtonGroup,
  'ui/buttons': UiButtons,
  'ui/cards': UiCards,
  'ui/carousel': UiCarousel,
  'ui/draggable-cards': UiDraggableCards,
  'ui/dropdowns': UiDropdowns,
  'ui/images': UiImages,
  'ui/links': UiLinks,
  'ui/list-group': UiListGroup,
  'ui/modals': UiModals,
  'ui/navbar': UiNavbar,
  'ui/notifications': UiNotifications,
  'ui/offcanvas': UiOffcanvas,
  'ui/pagination': UiPagination,
  'ui/popovers': UiPopovers,
  'ui/progress': UiProgress,
  'ui/ratings': UiRatings,
  'ui/ribbons': UiRibbons,
  'ui/scrollspy': UiScrollspy,
  'ui/skeletons': UiSkeletons,
  'ui/sortable': UiSortable,
  'ui/spinners': UiSpinners,
  'ui/swiper': UiSwiper,
  'ui/tabs': UiTabs,
  'ui/toasts': UiToasts,
  'ui/tooltips': UiTooltips,
  'ui/tour': UiTour,
  'ui/typography': UiTypography,
  'utilities/borders': UtilitiesBorders,
  'utilities/breakpoints': UtilitiesBreakpoints,
  'utilities/colors': UtilitiesColors,
  'utilities/flex-grid': UtilitiesFlexGrid,
  'utilities/helpers': UtilitiesHelpers,
  'utilities/position': UtilitiesPosition,
  'utilities/spacing': UtilitiesSpacing,
  'widgets': Widgets,
};

// Suspense boundary per route: for shell children this lands at the <Outlet>,
// keeping the shell mounted while the page chunk loads. Fallback is intentionally
// empty (the shell + anti-flash cover the brief fetch) — matches vue/next.
const wrap = (C: PageComponent): ReactElement => (
  <Suspense fallback={null}>
    <C />
  </Suspense>
);

export function App() {
  return (
    <AuthProvider>
      <CustomizerProvider>
        <BrowserRouter>
          <DocumentTitle />
          <Routes>
            {/* Standalone (no app shell) */}
            {Object.entries(standalone).map(([slug, C]) => (
              <Route key={slug} path={slug} element={wrap(C)} />
            ))}
            {/* Full-screen app shell (apps/*) */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {Object.entries(appShell).map(([slug, C]) => (
                <Route key={slug} path={slug} element={wrap(C)} />
              ))}
            </Route>
            {/* Dashboard shell */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={wrap(JammuDashboard)} />
              <Route path="dashboards/sales" element={wrap(Sales)} />
              {Object.entries(shell).map(([slug, C]) => (
                <Route key={slug} path={slug} element={wrap(C)} />
              ))}
            </Route>
            {/* Unknown → 404 screen (standalone) */}
            <Route path="*" element={wrap(standalone['error/404'])} />
          </Routes>
        </BrowserRouter>
      </CustomizerProvider>
    </AuthProvider>
  );
}

export default App;
