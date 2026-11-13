import { lazy, type ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { wrap } from './routeHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// ERP & TEMPLATE MODULE ROUTES (UI, Ecommerce, Pages, Forms, Tables, Charts, etc.)
// ═══════════════════════════════════════════════════════════════════════════

const blogBlogDetails = lazy(() => import('../pages/blog/BlogDetails'));
const blogCreate = lazy(() => import('../pages/blog/Create'));
const blogList = lazy(() => import('../pages/blog/List'));
const chartsApexArea = lazy(() => import('../pages/charts/ApexArea'));
const chartsApexBar = lazy(() => import('../pages/charts/ApexBar'));
const chartsApexFinancial = lazy(() => import('../pages/charts/ApexFinancial'));
const chartsApexLine = lazy(() => import('../pages/charts/ApexLine'));
const chartsApexMixed = lazy(() => import('../pages/charts/ApexMixed'));
const chartsApexPie = lazy(() => import('../pages/charts/ApexPie'));
const chartsChartJs = lazy(() => import('../pages/charts/ChartJs'));
const chartsECharts = lazy(() => import('../pages/charts/ECharts'));
const chartsSparklines = lazy(() => import('../pages/charts/Sparklines'));
const crmCompanies = lazy(() => import('../pages/crm/Companies'));
const crmContacts = lazy(() => import('../pages/crm/Contacts'));
const crmDeals = lazy(() => import('../pages/crm/Deals'));
const crmLeads = lazy(() => import('../pages/crm/Leads'));
const cryptoBuySell = lazy(() => import('../pages/crypto/BuySell'));
const cryptoExchange = lazy(() => import('../pages/crypto/Exchange'));
const cryptoMarketcap = lazy(() => import('../pages/crypto/Marketcap'));
const cryptoTransactions = lazy(() => import('../pages/crypto/Transactions'));
const cryptoWallet = lazy(() => import('../pages/crypto/Wallet'));
const dashboardsAnalytics = lazy(() => import('../pages/dashboards/Analytics'));
const dashboardsCrm = lazy(() => import('../pages/dashboards/Crm'));
const dashboardsCrypto = lazy(() => import('../pages/dashboards/Crypto'));
const dashboardsEcommerce = lazy(() => import('../pages/dashboards/Ecommerce'));
const dashboardsErpMainDashboard = lazy(() => import('../pages/dashboards/ErpMainDashboard'));
const dashboardsFinance = lazy(() => import('../pages/dashboards/Finance'));
const dashboardsHealthcare = lazy(() => import('../pages/dashboards/Healthcare'));
const dashboardsHr = lazy(() => import('../pages/dashboards/Hr'));
const dashboardsJobs = lazy(() => import('../pages/dashboards/Jobs'));
const dashboardsLms = lazy(() => import('../pages/dashboards/Lms'));
const dashboardsModulePlaceholder = lazy(() => import('../pages/dashboards/ModulePlaceholder'));
const dashboardsNft = lazy(() => import('../pages/dashboards/Nft'));
const dashboardsPodcast = lazy(() => import('../pages/dashboards/Podcast'));
const dashboardsPos = lazy(() => import('../pages/dashboards/Pos'));
const dashboardsProjects = lazy(() => import('../pages/dashboards/Projects'));
const dashboardsSales = lazy(() => import('../pages/dashboards/Sales'));
const dashboardsSchool = lazy(() => import('../pages/dashboards/School'));
const dashboardsSocial = lazy(() => import('../pages/dashboards/Social'));
const dashboardsSolarErp = lazy(() => import('../pages/dashboards/SolarErp'));
const dashboardsStocks = lazy(() => import('../pages/dashboards/Stocks'));
const docsIndex = lazy(() => import('../pages/docs/Index'));
const ecommerceAddProduct = lazy(() => import('../pages/ecommerce/AddProduct'));
const ecommerceCart = lazy(() => import('../pages/ecommerce/Cart'));
const ecommerceCheckout = lazy(() => import('../pages/ecommerce/Checkout'));
const ecommerceCreateInvoice = lazy(() => import('../pages/ecommerce/CreateInvoice'));
const ecommerceCustomerDetails = lazy(() => import('../pages/ecommerce/CustomerDetails'));
const ecommerceCustomers = lazy(() => import('../pages/ecommerce/Customers'));
const ecommerceEditProduct = lazy(() => import('../pages/ecommerce/EditProduct'));
const ecommerceInvoiceDetails = lazy(() => import('../pages/ecommerce/InvoiceDetails'));
const ecommerceInvoices = lazy(() => import('../pages/ecommerce/Invoices'));
const ecommerceOrderDetails = lazy(() => import('../pages/ecommerce/OrderDetails'));
const ecommerceOrders = lazy(() => import('../pages/ecommerce/Orders'));
const ecommerceOrderSuccess = lazy(() => import('../pages/ecommerce/OrderSuccess'));
const ecommerceProductDetails = lazy(() => import('../pages/ecommerce/ProductDetails'));
const ecommerceProducts = lazy(() => import('../pages/ecommerce/Products'));
const ecommerceSellers = lazy(() => import('../pages/ecommerce/Sellers'));
const formsAdvanced = lazy(() => import('../pages/forms/Advanced'));
const formsEditor = lazy(() => import('../pages/forms/Editor'));
const formsElements = lazy(() => import('../pages/forms/Elements'));
const formsFileUpload = lazy(() => import('../pages/forms/FileUpload'));
const formsFloatingLabels = lazy(() => import('../pages/forms/FloatingLabels'));
const formsInputMasks = lazy(() => import('../pages/forms/InputMasks'));
const formsLayouts = lazy(() => import('../pages/forms/Layouts'));
const formsPickers = lazy(() => import('../pages/forms/Pickers'));
const formsSelect = lazy(() => import('../pages/forms/Select'));
const formsValidation = lazy(() => import('../pages/forms/Validation'));
const formsWizard = lazy(() => import('../pages/forms/Wizard'));
const iconsBrands = lazy(() => import('../pages/icons/Brands'));
const iconsIconGallery = lazy(() => import('../pages/icons/IconGallery'));
const iconsLine = lazy(() => import('../pages/icons/Line'));
const iconsSolid = lazy(() => import('../pages/icons/Solid'));
const iconsTabler = lazy(() => import('../pages/icons/Tabler'));
const jobsCandidateDetails = lazy(() => import('../pages/jobs/CandidateDetails'));
const jobsJobDetails = lazy(() => import('../pages/jobs/JobDetails'));
const jobsJobPost = lazy(() => import('../pages/jobs/JobPost'));
const jobsList = lazy(() => import('../pages/jobs/List'));
const jobsSearchCandidate = lazy(() => import('../pages/jobs/SearchCandidate'));
const jobsSearchCompany = lazy(() => import('../pages/jobs/SearchCompany'));
const jobsSearchJobs = lazy(() => import('../pages/jobs/SearchJobs'));
const mapsGoogle = lazy(() => import('../pages/maps/Google'));
const mapsLeaflet = lazy(() => import('../pages/maps/Leaflet'));
const nftCreateNft = lazy(() => import('../pages/nft/CreateNft'));
const nftLiveAuction = lazy(() => import('../pages/nft/LiveAuction'));
const nftMarketplace = lazy(() => import('../pages/nft/Marketplace'));
const nftNftDetails = lazy(() => import('../pages/nft/NftDetails'));
const nftWallet = lazy(() => import('../pages/nft/Wallet'));
const pagesActivityLog = lazy(() => import('../pages/pages/ActivityLog'));
const pagesBilling = lazy(() => import('../pages/pages/Billing'));
const pagesComingSoon = lazy(() => import('../pages/pages/ComingSoon'));
const pagesEvents = lazy(() => import('../pages/pages/Events'));
const pagesFaq = lazy(() => import('../pages/pages/Faq'));
const pagesLanding = lazy(() => import('../pages/pages/Landing'));
const pagesLogout = lazy(() => import('../pages/pages/Logout'));
const pagesNestedMenu = lazy(() => import('../pages/pages/NestedMenu'));
const pagesNotifications = lazy(() => import('../pages/pages/Notifications'));
const pagesPricing = lazy(() => import('../pages/pages/Pricing'));
const pagesPrivacy = lazy(() => import('../pages/pages/Privacy'));
const pagesProfile = lazy(() => import('../pages/pages/Profile'));
const pagesProfileSettings = lazy(() => import('../pages/pages/ProfileSettings'));
const pagesSearchResults = lazy(() => import('../pages/pages/SearchResults'));
const pagesStarter = lazy(() => import('../pages/pages/Starter'));
const pagesSupport = lazy(() => import('../pages/pages/Support'));
const pagesSweetAlerts = lazy(() => import('../pages/pages/SweetAlerts'));
const pagesTeam = lazy(() => import('../pages/pages/Team'));
const pagesTerms = lazy(() => import('../pages/pages/Terms'));
const pagesTestimonials = lazy(() => import('../pages/pages/Testimonials'));
const pagesTimeline = lazy(() => import('../pages/pages/Timeline'));
const pagesTour = lazy(() => import('../pages/pages/Tour'));
const Placeholder = lazy(() => import('../pages/Placeholder'));
const projectsCreate = lazy(() => import('../pages/projects/Create'));
const projectsList = lazy(() => import('../pages/projects/List'));
const projectsOverview = lazy(() => import('../pages/projects/Overview'));
const tablesBasic = lazy(() => import('../pages/tables/Basic'));
const tablesDataTables = lazy(() => import('../pages/tables/DataTables'));
const tablesEditable = lazy(() => import('../pages/tables/Editable'));
const tablesGridjs = lazy(() => import('../pages/tables/Gridjs'));
const uiAccordions = lazy(() => import('../pages/ui/Accordions'));
const uiAlerts = lazy(() => import('../pages/ui/Alerts'));
const uiAvatars = lazy(() => import('../pages/ui/Avatars'));
const uiBadges = lazy(() => import('../pages/ui/Badges'));
const uiBreadcrumb = lazy(() => import('../pages/ui/Breadcrumb'));
const uiButtonGroup = lazy(() => import('../pages/ui/ButtonGroup'));
const uiButtons = lazy(() => import('../pages/ui/Buttons'));
const uiCards = lazy(() => import('../pages/ui/Cards'));
const uiCarousel = lazy(() => import('../pages/ui/Carousel'));
const uiDraggableCards = lazy(() => import('../pages/ui/DraggableCards'));
const uiDropdowns = lazy(() => import('../pages/ui/Dropdowns'));
const uiImages = lazy(() => import('../pages/ui/Images'));
const uiLinks = lazy(() => import('../pages/ui/Links'));
const uiListGroup = lazy(() => import('../pages/ui/ListGroup'));
const uiModals = lazy(() => import('../pages/ui/Modals'));
const uiNavbar = lazy(() => import('../pages/ui/Navbar'));
const uiNotifications = lazy(() => import('../pages/ui/Notifications'));
const uiOffcanvas = lazy(() => import('../pages/ui/Offcanvas'));
const uiPagination = lazy(() => import('../pages/ui/Pagination'));
const uiPopovers = lazy(() => import('../pages/ui/Popovers'));
const uiProgress = lazy(() => import('../pages/ui/Progress'));
const uiRatings = lazy(() => import('../pages/ui/Ratings'));
const uiRibbons = lazy(() => import('../pages/ui/Ribbons'));
const uiScrollspy = lazy(() => import('../pages/ui/Scrollspy'));
const uiSkeletons = lazy(() => import('../pages/ui/Skeletons'));
const uiSortable = lazy(() => import('../pages/ui/Sortable'));
const uiSpinners = lazy(() => import('../pages/ui/Spinners'));
const uiSwiper = lazy(() => import('../pages/ui/Swiper'));
const uiTabs = lazy(() => import('../pages/ui/Tabs'));
const uiToasts = lazy(() => import('../pages/ui/Toasts'));
const uiTooltips = lazy(() => import('../pages/ui/Tooltips'));
const uiTour = lazy(() => import('../pages/ui/Tour'));
const uiTypography = lazy(() => import('../pages/ui/Typography'));
const utilitiesBorders = lazy(() => import('../pages/utilities/Borders'));
const utilitiesBreakpoints = lazy(() => import('../pages/utilities/Breakpoints'));
const utilitiesColors = lazy(() => import('../pages/utilities/Colors'));
const utilitiesFlexGrid = lazy(() => import('../pages/utilities/FlexGrid'));
const utilitiesHelpers = lazy(() => import('../pages/utilities/Helpers'));
const utilitiesPosition = lazy(() => import('../pages/utilities/Position'));
const utilitiesSpacing = lazy(() => import('../pages/utilities/Spacing'));
const Widgets = lazy(() => import('../pages/Widgets'));

export const templateRoutes: ReactElement[] = [
  <Route key="tpl.blog/blog-details" path="blog/blog-details" element={wrap(blogBlogDetails)} />,
  <Route key="tpl.blog/create" path="blog/create" element={wrap(blogCreate)} />,
  <Route key="tpl.blog/list" path="blog/list" element={wrap(blogList)} />,
  <Route key="tpl.charts/apex-area" path="charts/apex-area" element={wrap(chartsApexArea)} />,
  <Route key="tpl.charts/apex-bar" path="charts/apex-bar" element={wrap(chartsApexBar)} />,
  <Route key="tpl.charts/apex-financial" path="charts/apex-financial" element={wrap(chartsApexFinancial)} />,
  <Route key="tpl.charts/apex-line" path="charts/apex-line" element={wrap(chartsApexLine)} />,
  <Route key="tpl.charts/apex-mixed" path="charts/apex-mixed" element={wrap(chartsApexMixed)} />,
  <Route key="tpl.charts/apex-pie" path="charts/apex-pie" element={wrap(chartsApexPie)} />,
  <Route key="tpl.charts/chartjs" path="charts/chartjs" element={wrap(chartsChartJs)} />,
  <Route key="tpl.charts/echarts" path="charts/echarts" element={wrap(chartsECharts)} />,
  <Route key="tpl.charts/sparklines" path="charts/sparklines" element={wrap(chartsSparklines)} />,
  <Route key="tpl.crm/companies" path="crm/companies" element={wrap(crmCompanies)} />,
  <Route key="tpl.crm/contacts" path="crm/contacts" element={wrap(crmContacts)} />,
  <Route key="tpl.crm/deals" path="crm/deals" element={wrap(crmDeals)} />,
  <Route key="tpl.crm/leads" path="crm/leads" element={wrap(crmLeads)} />,
  <Route key="tpl.crypto/buy-sell" path="crypto/buy-sell" element={wrap(cryptoBuySell)} />,
  <Route key="tpl.crypto/exchange" path="crypto/exchange" element={wrap(cryptoExchange)} />,
  <Route key="tpl.crypto/marketcap" path="crypto/marketcap" element={wrap(cryptoMarketcap)} />,
  <Route key="tpl.crypto/transactions" path="crypto/transactions" element={wrap(cryptoTransactions)} />,
  <Route key="tpl.crypto/wallet" path="crypto/wallet" element={wrap(cryptoWallet)} />,
  <Route key="tpl.dashboards/analytics" path="dashboards/analytics" element={wrap(dashboardsAnalytics)} />,
  <Route key="tpl.dashboards/crm" path="dashboards/crm" element={wrap(dashboardsCrm)} />,
  <Route key="tpl.dashboards/crypto" path="dashboards/crypto" element={wrap(dashboardsCrypto)} />,
  <Route key="tpl.dashboards/ecommerce" path="dashboards/ecommerce" element={wrap(dashboardsEcommerce)} />,
  <Route key="tpl.dashboards/erp-main-dashboard" path="dashboards/erp-main-dashboard" element={wrap(dashboardsErpMainDashboard)} />,
  <Route key="tpl.dashboards/finance" path="dashboards/finance" element={wrap(dashboardsFinance)} />,
  <Route key="tpl.dashboards/healthcare" path="dashboards/healthcare" element={wrap(dashboardsHealthcare)} />,
  <Route key="tpl.dashboards/hr" path="dashboards/hr" element={wrap(dashboardsHr)} />,
  <Route key="tpl.dashboards/jobs" path="dashboards/jobs" element={wrap(dashboardsJobs)} />,
  <Route key="tpl.dashboards/lms" path="dashboards/lms" element={wrap(dashboardsLms)} />,
  <Route key="tpl.dashboards/module-placeholder" path="dashboards/module-placeholder" element={wrap(dashboardsModulePlaceholder)} />,
  <Route key="tpl.dashboards/nft" path="dashboards/nft" element={wrap(dashboardsNft)} />,
  <Route key="tpl.dashboards/podcast" path="dashboards/podcast" element={wrap(dashboardsPodcast)} />,
  <Route key="tpl.dashboards/pos" path="dashboards/pos" element={wrap(dashboardsPos)} />,
  <Route key="tpl.dashboards/projects" path="dashboards/projects" element={wrap(dashboardsProjects)} />,
  <Route key="tpl.dashboards/sales" path="dashboards/sales" element={wrap(dashboardsSales)} />,
  <Route key="tpl.dashboards/school" path="dashboards/school" element={wrap(dashboardsSchool)} />,
  <Route key="tpl.dashboards/social" path="dashboards/social" element={wrap(dashboardsSocial)} />,
  <Route key="tpl.dashboards/solar-erp" path="dashboards/solar-erp" element={wrap(dashboardsSolarErp)} />,
  <Route key="tpl.dashboards/stocks" path="dashboards/stocks" element={wrap(dashboardsStocks)} />,
  <Route key="tpl.docs" path="docs" element={wrap(docsIndex)} />,
  <Route key="tpl.ecommerce/add-product" path="ecommerce/add-product" element={wrap(ecommerceAddProduct)} />,
  <Route key="tpl.ecommerce/cart" path="ecommerce/cart" element={wrap(ecommerceCart)} />,
  <Route key="tpl.ecommerce/checkout" path="ecommerce/checkout" element={wrap(ecommerceCheckout)} />,
  <Route key="tpl.ecommerce/create-invoice" path="ecommerce/create-invoice" element={wrap(ecommerceCreateInvoice)} />,
  <Route key="tpl.ecommerce/customer-details" path="ecommerce/customer-details" element={wrap(ecommerceCustomerDetails)} />,
  <Route key="tpl.ecommerce/customers" path="ecommerce/customers" element={wrap(ecommerceCustomers)} />,
  <Route key="tpl.ecommerce/edit-product" path="ecommerce/edit-product" element={wrap(ecommerceEditProduct)} />,
  <Route key="tpl.ecommerce/invoice-details" path="ecommerce/invoice-details" element={wrap(ecommerceInvoiceDetails)} />,
  <Route key="tpl.ecommerce/invoices" path="ecommerce/invoices" element={wrap(ecommerceInvoices)} />,
  <Route key="tpl.ecommerce/order-details" path="ecommerce/order-details" element={wrap(ecommerceOrderDetails)} />,
  <Route key="tpl.ecommerce/orders" path="ecommerce/orders" element={wrap(ecommerceOrders)} />,
  <Route key="tpl.ecommerce/order-success" path="ecommerce/order-success" element={wrap(ecommerceOrderSuccess)} />,
  <Route key="tpl.ecommerce/product-details" path="ecommerce/product-details" element={wrap(ecommerceProductDetails)} />,
  <Route key="tpl.ecommerce/products" path="ecommerce/products" element={wrap(ecommerceProducts)} />,
  <Route key="tpl.ecommerce/sellers" path="ecommerce/sellers" element={wrap(ecommerceSellers)} />,
  <Route key="tpl.forms/advanced" path="forms/advanced" element={wrap(formsAdvanced)} />,
  <Route key="tpl.forms/editor" path="forms/editor" element={wrap(formsEditor)} />,
  <Route key="tpl.forms/elements" path="forms/elements" element={wrap(formsElements)} />,
  <Route key="tpl.forms/file-upload" path="forms/file-upload" element={wrap(formsFileUpload)} />,
  <Route key="tpl.forms/floating-labels" path="forms/floating-labels" element={wrap(formsFloatingLabels)} />,
  <Route key="tpl.forms/input-masks" path="forms/input-masks" element={wrap(formsInputMasks)} />,
  <Route key="tpl.forms/layouts" path="forms/layouts" element={wrap(formsLayouts)} />,
  <Route key="tpl.forms/pickers" path="forms/pickers" element={wrap(formsPickers)} />,
  <Route key="tpl.forms/select" path="forms/select" element={wrap(formsSelect)} />,
  <Route key="tpl.forms/validation" path="forms/validation" element={wrap(formsValidation)} />,
  <Route key="tpl.forms/wizard" path="forms/wizard" element={wrap(formsWizard)} />,
  <Route key="tpl.icons/brands" path="icons/brands" element={wrap(iconsBrands)} />,
  <Route key="tpl.icons/icon-gallery" path="icons/icon-gallery" element={wrap(iconsIconGallery)} />,
  <Route key="tpl.icons/line" path="icons/line" element={wrap(iconsLine)} />,
  <Route key="tpl.icons/solid" path="icons/solid" element={wrap(iconsSolid)} />,
  <Route key="tpl.icons/tabler" path="icons/tabler" element={wrap(iconsTabler)} />,
  <Route key="tpl.jobs/candidate-details" path="jobs/candidate-details" element={wrap(jobsCandidateDetails)} />,
  <Route key="tpl.jobs/job-details" path="jobs/job-details" element={wrap(jobsJobDetails)} />,
  <Route key="tpl.jobs/job-post" path="jobs/job-post" element={wrap(jobsJobPost)} />,
  <Route key="tpl.jobs/list" path="jobs/list" element={wrap(jobsList)} />,
  <Route key="tpl.jobs/search-candidate" path="jobs/search-candidate" element={wrap(jobsSearchCandidate)} />,
  <Route key="tpl.jobs/search-company" path="jobs/search-company" element={wrap(jobsSearchCompany)} />,
  <Route key="tpl.jobs/search-jobs" path="jobs/search-jobs" element={wrap(jobsSearchJobs)} />,
  <Route key="tpl.maps/google" path="maps/google" element={wrap(mapsGoogle)} />,
  <Route key="tpl.maps/leaflet" path="maps/leaflet" element={wrap(mapsLeaflet)} />,
  <Route key="tpl.nft/create-nft" path="nft/create-nft" element={wrap(nftCreateNft)} />,
  <Route key="tpl.nft/live-auction" path="nft/live-auction" element={wrap(nftLiveAuction)} />,
  <Route key="tpl.nft/marketplace" path="nft/marketplace" element={wrap(nftMarketplace)} />,
  <Route key="tpl.nft/nft-details" path="nft/nft-details" element={wrap(nftNftDetails)} />,
  <Route key="tpl.nft/wallet" path="nft/wallet" element={wrap(nftWallet)} />,
  <Route key="tpl.pages/activity-log" path="pages/activity-log" element={wrap(pagesActivityLog)} />,
  <Route key="tpl.pages/billing" path="pages/billing" element={wrap(pagesBilling)} />,
  <Route key="tpl.pages/coming-soon" path="pages/coming-soon" element={wrap(pagesComingSoon)} />,
  <Route key="tpl.pages/events" path="pages/events" element={wrap(pagesEvents)} />,
  <Route key="tpl.pages/faq" path="pages/faq" element={wrap(pagesFaq)} />,
  <Route key="tpl.pages/landing" path="pages/landing" element={wrap(pagesLanding)} />,
  <Route key="tpl.pages/logout" path="pages/logout" element={wrap(pagesLogout)} />,
  <Route key="tpl.pages/nested-menu" path="pages/nested-menu" element={wrap(pagesNestedMenu)} />,
  <Route key="tpl.pages/notifications" path="pages/notifications" element={wrap(pagesNotifications)} />,
  <Route key="tpl.pages/pricing" path="pages/pricing" element={wrap(pagesPricing)} />,
  <Route key="tpl.pages/privacy" path="pages/privacy" element={wrap(pagesPrivacy)} />,
  <Route key="tpl.pages/profile" path="pages/profile" element={wrap(pagesProfile)} />,
  <Route key="tpl.pages/profile-settings" path="pages/profile-settings" element={wrap(pagesProfileSettings)} />,
  <Route key="tpl.pages/search-results" path="pages/search-results" element={wrap(pagesSearchResults)} />,
  <Route key="tpl.pages/starter" path="pages/starter" element={wrap(pagesStarter)} />,
  <Route key="tpl.pages/support" path="pages/support" element={wrap(pagesSupport)} />,
  <Route key="tpl.pages/sweet-alerts" path="pages/sweet-alerts" element={wrap(pagesSweetAlerts)} />,
  <Route key="tpl.pages/team" path="pages/team" element={wrap(pagesTeam)} />,
  <Route key="tpl.pages/terms" path="pages/terms" element={wrap(pagesTerms)} />,
  <Route key="tpl.pages/testimonials" path="pages/testimonials" element={wrap(pagesTestimonials)} />,
  <Route key="tpl.pages/timeline" path="pages/timeline" element={wrap(pagesTimeline)} />,
  <Route key="tpl.pages/tour" path="pages/tour" element={wrap(pagesTour)} />,
  <Route key="tpl.placeholder" path="placeholder" element={wrap(Placeholder)} />,
  <Route key="tpl.projects/create" path="projects/create" element={wrap(projectsCreate)} />,
  <Route key="tpl.projects/list" path="projects/list" element={wrap(projectsList)} />,
  <Route key="tpl.projects/overview" path="projects/overview" element={wrap(projectsOverview)} />,
  <Route key="tpl.tables/basic" path="tables/basic" element={wrap(tablesBasic)} />,
  <Route key="tpl.tables/data-tables" path="tables/data-tables" element={wrap(tablesDataTables)} />,
  <Route key="tpl.tables/editable" path="tables/editable" element={wrap(tablesEditable)} />,
  <Route key="tpl.tables/gridjs" path="tables/gridjs" element={wrap(tablesGridjs)} />,
  <Route key="tpl.ui/accordions" path="ui/accordions" element={wrap(uiAccordions)} />,
  <Route key="tpl.ui/alerts" path="ui/alerts" element={wrap(uiAlerts)} />,
  <Route key="tpl.ui/avatars" path="ui/avatars" element={wrap(uiAvatars)} />,
  <Route key="tpl.ui/badges" path="ui/badges" element={wrap(uiBadges)} />,
  <Route key="tpl.ui/breadcrumb" path="ui/breadcrumb" element={wrap(uiBreadcrumb)} />,
  <Route key="tpl.ui/button-group" path="ui/button-group" element={wrap(uiButtonGroup)} />,
  <Route key="tpl.ui/buttons" path="ui/buttons" element={wrap(uiButtons)} />,
  <Route key="tpl.ui/cards" path="ui/cards" element={wrap(uiCards)} />,
  <Route key="tpl.ui/carousel" path="ui/carousel" element={wrap(uiCarousel)} />,
  <Route key="tpl.ui/draggable-cards" path="ui/draggable-cards" element={wrap(uiDraggableCards)} />,
  <Route key="tpl.ui/dropdowns" path="ui/dropdowns" element={wrap(uiDropdowns)} />,
  <Route key="tpl.ui/images" path="ui/images" element={wrap(uiImages)} />,
  <Route key="tpl.ui/links" path="ui/links" element={wrap(uiLinks)} />,
  <Route key="tpl.ui/list-group" path="ui/list-group" element={wrap(uiListGroup)} />,
  <Route key="tpl.ui/modals" path="ui/modals" element={wrap(uiModals)} />,
  <Route key="tpl.ui/navbar" path="ui/navbar" element={wrap(uiNavbar)} />,
  <Route key="tpl.ui/notifications" path="ui/notifications" element={wrap(uiNotifications)} />,
  <Route key="tpl.ui/offcanvas" path="ui/offcanvas" element={wrap(uiOffcanvas)} />,
  <Route key="tpl.ui/pagination" path="ui/pagination" element={wrap(uiPagination)} />,
  <Route key="tpl.ui/popovers" path="ui/popovers" element={wrap(uiPopovers)} />,
  <Route key="tpl.ui/progress" path="ui/progress" element={wrap(uiProgress)} />,
  <Route key="tpl.ui/ratings" path="ui/ratings" element={wrap(uiRatings)} />,
  <Route key="tpl.ui/ribbons" path="ui/ribbons" element={wrap(uiRibbons)} />,
  <Route key="tpl.ui/scrollspy" path="ui/scrollspy" element={wrap(uiScrollspy)} />,
  <Route key="tpl.ui/skeletons" path="ui/skeletons" element={wrap(uiSkeletons)} />,
  <Route key="tpl.ui/sortable" path="ui/sortable" element={wrap(uiSortable)} />,
  <Route key="tpl.ui/spinners" path="ui/spinners" element={wrap(uiSpinners)} />,
  <Route key="tpl.ui/swiper" path="ui/swiper" element={wrap(uiSwiper)} />,
  <Route key="tpl.ui/tabs" path="ui/tabs" element={wrap(uiTabs)} />,
  <Route key="tpl.ui/toasts" path="ui/toasts" element={wrap(uiToasts)} />,
  <Route key="tpl.ui/tooltips" path="ui/tooltips" element={wrap(uiTooltips)} />,
  <Route key="tpl.ui/tour" path="ui/tour" element={wrap(uiTour)} />,
  <Route key="tpl.ui/typography" path="ui/typography" element={wrap(uiTypography)} />,
  <Route key="tpl.utilities/borders" path="utilities/borders" element={wrap(utilitiesBorders)} />,
  <Route key="tpl.utilities/breakpoints" path="utilities/breakpoints" element={wrap(utilitiesBreakpoints)} />,
  <Route key="tpl.utilities/colors" path="utilities/colors" element={wrap(utilitiesColors)} />,
  <Route key="tpl.utilities/flex-grid" path="utilities/flex-grid" element={wrap(utilitiesFlexGrid)} />,
  <Route key="tpl.utilities/helpers" path="utilities/helpers" element={wrap(utilitiesHelpers)} />,
  <Route key="tpl.utilities/position" path="utilities/position" element={wrap(utilitiesPosition)} />,
  <Route key="tpl.utilities/spacing" path="utilities/spacing" element={wrap(utilitiesSpacing)} />,
  <Route key="tpl.widgets" path="widgets" element={wrap(Widgets)} />,
  // Direct aliases for common paths
  <Route key="tpl.charts.apex" path="charts/apex" element={wrap(chartsApexArea)} />,
  <Route key="tpl.icons.feather" path="icons/feather" element={wrap(iconsLine)} />,
];
