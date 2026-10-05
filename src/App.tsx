
import { lazy, Suspense, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { canAccessSlug } from './services/stateAccess';
import { Layout } from './components/shell/Layout';
import { AppLayout } from './components/shell/AppLayout';
import { CustomizerProvider } from './context/CustomizerContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './pages/auth/ProtectedRoute';
import { DocumentTitle } from './hooks/useDocumentTitle';
import { DashboardSkeleton } from './common/skeletons';



type PageComponent = ReturnType<typeof lazy>;



const Sales = lazy(() => import('./pages/dashboards/Sales'));
const SolarLogin = lazy(() => import('./pages/auth/Login'));
const Error401 = lazy(() => import('./pages/error/Error401'));
const Error403 = lazy(() => import('./pages/error/Error403'));
const Error404 = lazy(() => import('./pages/error/Error404'));
const Error500 = lazy(() => import('./pages/error/Error500'));
const Error503 = lazy(() => import('./pages/error/Error503'));
const PagesComingSoon = lazy(() => import('./pages/pages/ComingSoon'));
const PagesLanding = lazy(() => import('./pages/pages/Landing'));
const PagesLogout = lazy(() => import('./pages/pages/Logout'));
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
// const BlogBlogDetails = lazy(() => import('./pages/blog/BlogDetails'));
// const BlogCreate = lazy(() => import('./pages/blog/Create'));
// const BlogList = lazy(() => import('./pages/blog/List'));
// const ChartsApexArea = lazy(() => import('./pages/charts/ApexArea'));
// const ChartsApexBar = lazy(() => import('./pages/charts/ApexBar'));
// const ChartsApexFinancial = lazy(() => import('./pages/charts/ApexFinancial'));
// const ChartsApexLine = lazy(() => import('./pages/charts/ApexLine'));
// const ChartsApexMixed = lazy(() => import('./pages/charts/ApexMixed'));
// const ChartsApexPie = lazy(() => import('./pages/charts/ApexPie'));
// const ChartsChartjs = lazy(() => import('./pages/charts/ChartJs'));
// const ChartsEcharts = lazy(() => import('./pages/charts/ECharts'));
// const ChartsSparklines = lazy(() => import('./pages/charts/Sparklines'));
// const CrmCompanies = lazy(() => import('./pages/crm/Companies'));
// const CrmContacts = lazy(() => import('./pages/crm/Contacts'));
// const CrmDeals = lazy(() => import('./pages/crm/Deals'));
// const CrmLeads = lazy(() => import('./pages/crm/Leads'));
// const CryptoBuySell = lazy(() => import('./pages/crypto/BuySell'));
// const CryptoExchange = lazy(() => import('./pages/crypto/Exchange'));
// const CryptoMarketcap = lazy(() => import('./pages/crypto/Marketcap'));
// const CryptoTransactions = lazy(() => import('./pages/crypto/Transactions'));
// const CryptoWallet = lazy(() => import('./pages/crypto/Wallet'));

const DLEDashboard = lazy(() => import('./components/DLE/DLEDashboard'));
const BiharAMCSSLAssignLight = lazy(() => import('./components/DLE/Bihar/AMC/SSL/BiharAMCSSLAssignLight'));
const BiharAMCSSLViewAssignLight = lazy(() => import('./components/DLE/Bihar/AMC/SSL/BiharAMCSSLViewAssignLight'));
const BiharAMCSSLViewSurveyLight = lazy(() => import('./components/DLE/Bihar/AMC/SSL/BiharAMCSSLViewSurveyLight'));
const BiharULAInstallationDashboard = lazy(() => import('./components/DLE/Bihar/Installation/ULA/BiharULAInstallationDashboard'));
const BiharULAInstallationViewData = lazy(() => import('./components/DLE/Bihar/Installation/ULA/BiharULAInstallationViewData'));
const UPAMCSSLAssignLights = lazy(() => import('./components/DLE/UP/AMC/SSL/UPAMCSSLAssignLights'));
const UPAMCSSLViewAssignLight = lazy(() => import('./components/DLE/UP/AMC/SSL/UPAMCSSLViewAssignLight'));
const UPAMCSSLViewSurveyLight = lazy(() => import('./components/DLE/UP/AMC/SSL/UPAMCSSLViewSurveyLight'));
const DLEManagementViewData = lazy(() => import('./components/DLE/Management/DLEManagementViewData'));

// const AssamDashboard = lazy(() => import('./components/V-Portal/assam/Installation/Swp/AssamDashboard'));
// const AssamInstallation = lazy(() => import('./components/V-Portal/assam/Installation/Swp/Installation'));
// const AssamInstallationRequest = lazy(() => import('./components/V-Portal/assam/Installation/Swp/InstallationRequest'));
// const AssamInstallationSite = lazy(() => import('./components/V-Portal/assam/Installation/Swp/InstallationSite'));
// const AssamViewInstallation = lazy(() => import('./components/V-Portal/assam/Installation/Swp/ViewInstallation'));
// const AssamViewPayment = lazy(() => import('./components/V-Portal/assam/Installation/Swp/ViewPayment'));

// const JammuDashboard = lazy(() => import('./components/V-Portal/jammu/Installation/SRT_70MW/JammuDashboard'));
// const JammuAddSRT70MWSingleCard = lazy(() => import('./components/V-Portal/jammu/Survey/SRT_70MW/AddJammuSRT70MWSingleCard'));

// ── Uttar Pradesh: Survey ──
// const UPSurveyRescoAssignedSurvey = lazy(() => import('./components/V-Portal/up/Survey/Resco/AssignedSurvey'));
// const UPSurveyRescoAddResco = lazy(() => import('./components/V-Portal/up/Survey/Resco/AddResco'));
// const UPSurveyRescoViewResco = lazy(() => import('./components/V-Portal/up/Survey/Resco/ViewResco'));
// const UPSurveySSLSurvey = lazy(() => import('./components/V-Portal/up/Survey/SSL/Survey'));
// const UPSurveySSLViewData = lazy(() => import('./components/V-Portal/up/Survey/SSL/ViewData'));

// ── Uttar Pradesh: Installation ──
// const UPInstRescoDb = lazy(() => import('./components/V-Portal/up/Installation/Resco/Dashboard'));
// const UPInstRescoAssigned = lazy(() => import('./components/V-Portal/up/Installation/Resco/AssignedSites'));
// const UPInstRescoInstall = lazy(() => import('./components/V-Portal/up/Installation/Resco/InstallSite'));
// const UPInstRescoDetail = lazy(() => import('./components/V-Portal/up/Installation/Resco/InstallationDetail'));
// const UPInstRescoClaim = lazy(() => import('./components/V-Portal/up/Installation/Resco/ClaimRequest'));
// const UPInstRescoBill = lazy(() => import('./components/V-Portal/up/Installation/Resco/MonthlyBill'));
// const UPInstSSLDb = lazy(() => import('./components/V-Portal/up/Installation/SSL/Dashboard'));
// const UPInstSSLAssigned = lazy(() => import('./components/V-Portal/up/Installation/SSL/AssignedLights'));
// const UPInstSSLInstall = lazy(() => import('./components/V-Portal/up/Installation/SSL/InstallLight'));
// const UPInstSSLDetail = lazy(() => import('./components/V-Portal/up/Installation/SSL/InstallationDetail'));
// const UPInstSSLClaim = lazy(() => import('./components/V-Portal/up/Installation/SSL/ClaimRequest'));
// const UPInstKCDb = lazy(() => import('./components/V-Portal/up/Installation/KusumC/Dashboard'));
// const UPInstKCReq = lazy(() => import('./components/V-Portal/up/Installation/KusumC/InstallationRequest'));
// const UPInstKCInstall = lazy(() => import('./components/V-Portal/up/Installation/KusumC/InstallSite'));
// const UPInstKCView = lazy(() => import('./components/V-Portal/up/Installation/KusumC/ViewInstallation'));
// const UPInstKCPay = lazy(() => import('./components/V-Portal/up/Installation/KusumC/ViewPayment'));

// // ── Uttar Pradesh: AMC ──
// const UPAMCRescoViewAssign = lazy(() => import('./components/V-Portal/up/AMC/Resco/ViewAssignSite'));
// const UPAMCRescoPending = lazy(() => import('./components/V-Portal/up/AMC/Resco/PendingAMC'));
// const UPAMCRescoCompleted = lazy(() => import('./components/V-Portal/up/AMC/Resco/CompletedAMC'));
// const UPAMCRescoPay = lazy(() => import('./components/V-Portal/up/AMC/Resco/Payment'));
// const UPAMCKCViewAssign = lazy(() => import('./components/V-Portal/up/AMC/KusumC/ViewAssignAMC'));
// const UPAMCKCPending = lazy(() => import('./components/V-Portal/up/AMC/KusumC/PendingAMC'));
// const UPAMCKCCompleted = lazy(() => import('./components/V-Portal/up/AMC/KusumC/CompletedAMC'));
// const UPAMCKBViewAssign = lazy(() => import('./components/V-Portal/up/AMC/KusumB/ViewAssignAMC'));
// const UPAMCKBPending = lazy(() => import('./components/V-Portal/up/AMC/KusumB/PendingAMC'));
// const UPAMCKBCompleted = lazy(() => import('./components/V-Portal/up/AMC/KusumB/CompletedAMC'));
// const UPAMCPPViewAssign = lazy(() => import('./components/V-Portal/up/AMC/PowerPack/ViewAssignAMC'));
// const UPAMCPPPending = lazy(() => import('./components/V-Portal/up/AMC/PowerPack/PendingAMC'));
// const UPAMCPPCompleted = lazy(() => import('./components/V-Portal/up/AMC/PowerPack/CompletedAMC'));
// const UPAMCOngridViewAssign = lazy(() => import('./components/V-Portal/up/AMC/Ongrid/ViewAssignAMC'));
// const UPAMCOngridPending = lazy(() => import('./components/V-Portal/up/AMC/Ongrid/PendingAMC'));
// const UPAMCOngridCompleted = lazy(() => import('./components/V-Portal/up/AMC/Ongrid/CompletedAMC'));
// const UPAMCOffgridViewAssign = lazy(() => import('./components/V-Portal/up/AMC/Offgrid/ViewAssignAMC'));
// const UPAMCOffgridPending = lazy(() => import('./components/V-Portal/up/AMC/Offgrid/PendingAMC'));
// const UPAMCOffgridCompleted = lazy(() => import('./components/V-Portal/up/AMC/Offgrid/CompletedAMC'));
// const UPAMCSSLViewAssign = lazy(() => import('./components/V-Portal/up/AMC/SSL/ViewAssignLight'));
// const UPAMCSSLPending = lazy(() => import('./components/V-Portal/up/AMC/SSL/PendingAMC'));
// const UPAMCSSLCompleted = lazy(() => import('./components/V-Portal/up/AMC/SSL/CompletedAMC'));
// const UPAMCSSLPay = lazy(() => import('./components/V-Portal/up/AMC/SSL/Payment'));
// const UPAMCSSL18WViewAssign = lazy(() => import('./components/V-Portal/up/AMC/SSL18W/ViewAssignLight'));
// const UPAMCSSL18WPending = lazy(() => import('./components/V-Portal/up/AMC/SSL18W/PendingAMC'));
// const UPAMCSSL18WCompleted = lazy(() => import('./components/V-Portal/up/AMC/SSL18W/CompletedAMC'));
// const UPAMCSSL18WPay = lazy(() => import('./components/V-Portal/up/AMC/SSL18W/Payment'));

// // ── Uttar Pradesh: Complaint ──
// const UPComplaintRescoAdd = lazy(() => import('./components/V-Portal/up/Complaint/Resco/AddComplaint'));
// const UPComplaintRescoView = lazy(() => import('./components/V-Portal/up/Complaint/Resco/ViewComplaint'));
// const UPComplaintRescoAssigned = lazy(() => import('./components/V-Portal/up/Complaint/Resco/AssignedComplaint'));
// const UPComplaintSSLAdd = lazy(() => import('./components/V-Portal/up/Complaint/SSL/AddComplaint'));
// const UPComplaintSSLView = lazy(() => import('./components/V-Portal/up/Complaint/SSL/ViewComplaint'));
// const UPComplaintSSLAssigned = lazy(() => import('./components/V-Portal/up/Complaint/SSL/AssignedComplaint'));
// const UPComplaintKCAdd = lazy(() => import('./components/V-Portal/up/Complaint/KusumC/AddComplaint'));
// const UPComplaintKCView = lazy(() => import('./components/V-Portal/up/Complaint/KusumC/ViewComplaint'));
// const UPComplaintKCAssigned = lazy(() => import('./components/V-Portal/up/Complaint/KusumC/AssignedComplaint'));
// const UPComplaintKBAdd = lazy(() => import('./components/V-Portal/up/Complaint/KusumB/AddComplaint'));
// const UPComplaintKBView = lazy(() => import('./components/V-Portal/up/Complaint/KusumB/ViewComplaint'));
// const UPComplaintKBAssigned = lazy(() => import('./components/V-Portal/up/Complaint/KusumB/AssignedComplaint'));
// const UPComplaintOngridAdd = lazy(() => import('./components/V-Portal/up/Complaint/Ongrid/AddComplaint'));
// const UPComplaintOngridView = lazy(() => import('./components/V-Portal/up/Complaint/Ongrid/ViewComplaint'));
// const UPComplaintOngridAssigned = lazy(() => import('./components/V-Portal/up/Complaint/Ongrid/AssignedComplaint'));
// const UPComplaintOffgridAdd = lazy(() => import('./components/V-Portal/up/Complaint/Offgrid/AddComplaint'));
// const UPComplaintOffgridView = lazy(() => import('./components/V-Portal/up/Complaint/Offgrid/ViewComplaint'));
// const UPComplaintOffgridAssigned = lazy(() => import('./components/V-Portal/up/Complaint/Offgrid/AssignedComplaint'));
// const UPComplaintPPAdd = lazy(() => import('./components/V-Portal/up/Complaint/PowerPack/AddComplaint'));
// const UPComplaintPPView = lazy(() => import('./components/V-Portal/up/Complaint/PowerPack/ViewComplaint'));
// const UPComplaintPPAssigned = lazy(() => import('./components/V-Portal/up/Complaint/PowerPack/AssignedComplaint'));
// const UPComplaintSRLMAdd = lazy(() => import('./components/V-Portal/up/Complaint/SRLMSRT/AddComplaint'));
// const UPComplaintSRLMView = lazy(() => import('./components/V-Portal/up/Complaint/SRLMSRT/ViewComplaint'));
// const UPComplaintSRLMAssigned = lazy(() => import('./components/V-Portal/up/Complaint/SRLMSRT/AssignedComplaint'));


// // ── Jammu ──
// const JMSurveyRescoAssign = lazy(() => import('./components/V-Portal/jammu/Survey/Resco/Assign_Survey'));
// const JMSurveyRescoPending = lazy(() => import('./components/V-Portal/jammu/Survey/Resco/Pending_Survey'));
// const JMSurveyRescoView = lazy(() => import('./components/V-Portal/jammu/Survey/Resco/View_Survey'));
// const JMSurveySRTView = lazy(() => import('./components/V-Portal/jammu/Survey/SRT_70MW/ViewData'));

// const JMInstRescoDb = lazy(() => import('./components/V-Portal/jammu/Installation/Resco/RescoDashboard'));
// const JMInstRescoAssigned = lazy(() => import('./components/V-Portal/jammu/Installation/Resco/RescoAssignedSites'));
// const JMInstRescoInstall = lazy(() => import('./components/V-Portal/jammu/Installation/Resco/RescoInstallSite'));
// const JMInstRescoDetail = lazy(() => import('./components/V-Portal/jammu/Installation/Resco/RescoInstallationDetails'));
// const JMInstRescoClaim = lazy(() => import('./components/V-Portal/jammu/Installation/Resco/RescoClaimRequest'));

// const JMInstSRTAssign = lazy(() => import('./components/V-Portal/jammu/Installation/SRT_70MW/AssignSite'));
// const JMInstSRTInstall = lazy(() => import('./components/V-Portal/jammu/Installation/SRT_70MW/InstallSites'));
// const JMInstSRTDetail = lazy(() => import('./components/V-Portal/jammu/Installation/SRT_70MW/InstallationDetails'));
// const JMInstSRTClaim = lazy(() => import('./components/V-Portal/jammu/Installation/SRT_70MW/ClaimRequest'));

// const JMInstSSLDb = lazy(() => import('./components/V-Portal/jammu/Installation/SSL/SSLDashboard'));
// const JMInstSSLAssign = lazy(() => import('./components/V-Portal/jammu/Installation/SSL/AssignLights'));
// const JMInstSSLInstall = lazy(() => import('./components/V-Portal/jammu/Installation/SSL/InstallLights'));
// const JMInstSSLDetail = lazy(() => import('./components/V-Portal/jammu/Installation/SSL/SSLInstallationDetails'));
// const JMInstSSLClaim = lazy(() => import('./components/V-Portal/jammu/Installation/SSL/SSLClaimRequest'));

// const JMInstSWPDb = lazy(() => import('./components/V-Portal/jammu/Installation/SWP/SWPDashboard'));
// const JMInstSWPReq = lazy(() => import('./components/V-Portal/jammu/Installation/SWP/SWPInstallationRequest'));
// const JMInstSWPSite = lazy(() => import('./components/V-Portal/jammu/Installation/SWP/SWPInstallationSite'));
// const JMInstSWPView = lazy(() => import('./components/V-Portal/jammu/Installation/SWP/SWPViewInstallation'));
// const JMInstSWPPay = lazy(() => import('./components/V-Portal/jammu/Installation/SWP/SWPViewPayment'));

// const JMExpRequest = lazy(() => import('./components/V-Portal/jammu/InstallationExpenses/SRT_70MW/RequestExpenses'));
// const JMExpView = lazy(() => import('./components/V-Portal/jammu/InstallationExpenses/SRT_70MW/ViewExpenses'));
// const JMExpPay = lazy(() => import('./components/V-Portal/jammu/InstallationExpenses/SRT_70MW/ViewPayments'));

// const JMAMCRescoAssign = lazy(() => import('./components/V-Portal/jammu/AMC/Resco/AMCRescoAssignSurvey'));
// const JMAMCRescoPending = lazy(() => import('./components/V-Portal/jammu/AMC/Resco/AMCRescoPendingSurvey'));
// const JMAMCRescoView = lazy(() => import('./components/V-Portal/jammu/AMC/Resco/AMCRescoViewSurvey'));
// const JMAMCSSLViewAssign = lazy(() => import('./components/V-Portal/jammu/AMC/SSL/ViewAssignAMC'));

// const DashboardsAnalytics = lazy(() => import('./pages/dashboards/Analytics'));
// const DashboardsCrm = lazy(() => import('./pages/dashboards/Crm'));
// const DashboardsCrypto = lazy(() => import('./pages/dashboards/Crypto'));
// const DashboardsEcommerce = lazy(() => import('./pages/dashboards/Ecommerce'));
// const DashboardsFinance = lazy(() => import('./pages/dashboards/Finance'));
// const DashboardsHealthcare = lazy(() => import('./pages/dashboards/Healthcare'));
// const DashboardsHr = lazy(() => import('./pages/dashboards/Hr'));
// const DashboardsJobs = lazy(() => import('./pages/dashboards/Jobs'));
// const DashboardsLms = lazy(() => import('./pages/dashboards/Lms'));
// const DashboardsNft = lazy(() => import('./pages/dashboards/Nft'));
// const DashboardsPodcast = lazy(() => import('./pages/dashboards/Podcast'));
// const DashboardsPos = lazy(() => import('./pages/dashboards/Pos'));
// const DashboardsProjects = lazy(() => import('./pages/dashboards/Projects'));
// const DashboardsSchool = lazy(() => import('./pages/dashboards/School'));
// const DashboardsSocial = lazy(() => import('./pages/dashboards/Social'));
// const DashboardsStocks = lazy(() => import('./pages/dashboards/Stocks'));
// const DocsIndex = lazy(() => import('./pages/docs/Index'));
// const EcommerceAddProduct = lazy(() => import('./pages/ecommerce/AddProduct'));
// const EcommerceCart = lazy(() => import('./pages/ecommerce/Cart'));
// const EcommerceCheckout = lazy(() => import('./pages/ecommerce/Checkout'));
// const EcommerceCreateInvoice = lazy(() => import('./pages/ecommerce/CreateInvoice'));
// const EcommerceCustomerDetails = lazy(() => import('./pages/ecommerce/CustomerDetails'));
// const EcommerceCustomers = lazy(() => import('./pages/ecommerce/Customers'));
// const EcommerceEditProduct = lazy(() => import('./pages/ecommerce/EditProduct'));
// const EcommerceInvoiceDetails = lazy(() => import('./pages/ecommerce/InvoiceDetails'));
// const EcommerceInvoices = lazy(() => import('./pages/ecommerce/Invoices'));
// const EcommerceOrderDetails = lazy(() => import('./pages/ecommerce/OrderDetails'));
// const EcommerceOrderSuccess = lazy(() => import('./pages/ecommerce/OrderSuccess'));
// const EcommerceOrders = lazy(() => import('./pages/ecommerce/Orders'));
// const EcommerceProductDetails = lazy(() => import('./pages/ecommerce/ProductDetails'));
// const EcommerceProducts = lazy(() => import('./pages/ecommerce/Products'));
// const EcommerceSellers = lazy(() => import('./pages/ecommerce/Sellers'));
// const FormsAdvanced = lazy(() => import('./pages/forms/Advanced'));
// const FormsEditor = lazy(() => import('./pages/forms/Editor'));
// const FormsElements = lazy(() => import('./pages/forms/Elements'));
// const FormsFileUpload = lazy(() => import('./pages/forms/FileUpload'));
// const FormsFloatingLabels = lazy(() => import('./pages/forms/FloatingLabels'));
// const FormsInputMasks = lazy(() => import('./pages/forms/InputMasks'));
// const FormsLayouts = lazy(() => import('./pages/forms/Layouts'));
// const FormsPickers = lazy(() => import('./pages/forms/Pickers'));
// const FormsSelect = lazy(() => import('./pages/forms/Select'));
// const FormsValidation = lazy(() => import('./pages/forms/Validation'));
// const FormsWizard = lazy(() => import('./pages/forms/Wizard'));
// const IconsBrands = lazy(() => import('./pages/icons/Brands'));
// const IconsLine = lazy(() => import('./pages/icons/Line'));
// const IconsSolid = lazy(() => import('./pages/icons/Solid'));
// const IconsTabler = lazy(() => import('./pages/icons/Tabler'));
// const JobsCandidateDetails = lazy(() => import('./pages/jobs/CandidateDetails'));
// const JobsJobDetails = lazy(() => import('./pages/jobs/JobDetails'));
// const JobsJobPost = lazy(() => import('./pages/jobs/JobPost'));
// const JobsList = lazy(() => import('./pages/jobs/List'));
// const JobsSearchCandidate = lazy(() => import('./pages/jobs/SearchCandidate'));
// const JobsSearchCompany = lazy(() => import('./pages/jobs/SearchCompany'));
// const JobsSearchJobs = lazy(() => import('./pages/jobs/SearchJobs'));
// const MapsGoogle = lazy(() => import('./pages/maps/Google'));
// const MapsLeaflet = lazy(() => import('./pages/maps/Leaflet'));
// const NftCreateNft = lazy(() => import('./pages/nft/CreateNft'));
// const NftLiveAuction = lazy(() => import('./pages/nft/LiveAuction'));
// const NftMarketplace = lazy(() => import('./pages/nft/Marketplace'));
// const NftNftDetails = lazy(() => import('./pages/nft/NftDetails'));
// const NftWallet = lazy(() => import('./pages/nft/Wallet'));
// const PagesActivityLog = lazy(() => import('./pages/pages/ActivityLog'));
// const PagesBilling = lazy(() => import('./pages/pages/Billing'));
// const PagesEvents = lazy(() => import('./pages/pages/Events'));
// const PagesFaq = lazy(() => import('./pages/pages/Faq'));
// const PagesNestedMenu = lazy(() => import('./pages/pages/NestedMenu'));
// const PagesNotifications = lazy(() => import('./pages/pages/Notifications'));
// const PagesPricing = lazy(() => import('./pages/pages/Pricing'));
// const PagesPrivacy = lazy(() => import('./pages/pages/Privacy'));
// const PagesProfile = lazy(() => import('./pages/pages/Profile'));
// const PagesProfileSettings = lazy(() => import('./pages/pages/ProfileSettings'));
// const PagesSearchResults = lazy(() => import('./pages/pages/SearchResults'));
// const PagesStarter = lazy(() => import('./pages/pages/Starter'));
// const PagesSupport = lazy(() => import('./pages/pages/Support'));
// const PagesSweetAlerts = lazy(() => import('./pages/pages/SweetAlerts'));
// const PagesTeam = lazy(() => import('./pages/pages/Team'));
// const PagesTerms = lazy(() => import('./pages/pages/Terms'));
// const PagesTestimonials = lazy(() => import('./pages/pages/Testimonials'));
// const PagesTimeline = lazy(() => import('./pages/pages/Timeline'));
// const PagesTour = lazy(() => import('./pages/pages/Tour'));
// const ProjectsCreate = lazy(() => import('./pages/projects/Create'));
// const ProjectsList = lazy(() => import('./pages/projects/List'));
// const ProjectsOverview = lazy(() => import('./pages/projects/Overview'));
// const TablesBasic = lazy(() => import('./pages/tables/Basic'));
// const TablesDataTables = lazy(() => import('./pages/tables/DataTables'));
// const TablesEditable = lazy(() => import('./pages/tables/Editable'));
// const TablesGridjs = lazy(() => import('./pages/tables/Gridjs'));
// const UiAccordions = lazy(() => import('./pages/ui/Accordions'));
// const UiAlerts = lazy(() => import('./pages/ui/Alerts'));
// const UiAvatars = lazy(() => import('./pages/ui/Avatars'));
// const UiBadges = lazy(() => import('./pages/ui/Badges'));
// const UiBreadcrumb = lazy(() => import('./pages/ui/Breadcrumb'));
// const UiButtonGroup = lazy(() => import('./pages/ui/ButtonGroup'));
// const UiButtons = lazy(() => import('./pages/ui/Buttons'));
// const UiCards = lazy(() => import('./pages/ui/Cards'));
// const UiCarousel = lazy(() => import('./pages/ui/Carousel'));
// const UiDraggableCards = lazy(() => import('./pages/ui/DraggableCards'));
// const UiDropdowns = lazy(() => import('./pages/ui/Dropdowns'));
// const UiImages = lazy(() => import('./pages/ui/Images'));
// const UiLinks = lazy(() => import('./pages/ui/Links'));
// const UiListGroup = lazy(() => import('./pages/ui/ListGroup'));
// const UiModals = lazy(() => import('./pages/ui/Modals'));
// const UiNavbar = lazy(() => import('./pages/ui/Navbar'));
// const UiNotifications = lazy(() => import('./pages/ui/Notifications'));
// const UiOffcanvas = lazy(() => import('./pages/ui/Offcanvas'));
// const UiPagination = lazy(() => import('./pages/ui/Pagination'));
// const UiPopovers = lazy(() => import('./pages/ui/Popovers'));
// const UiProgress = lazy(() => import('./pages/ui/Progress'));
// const UiRatings = lazy(() => import('./pages/ui/Ratings'));
// const UiRibbons = lazy(() => import('./pages/ui/Ribbons'));
// const UiScrollspy = lazy(() => import('./pages/ui/Scrollspy'));
// const UiSkeletons = lazy(() => import('./pages/ui/Skeletons'));
// const UiSortable = lazy(() => import('./pages/ui/Sortable'));
// const UiSpinners = lazy(() => import('./pages/ui/Spinners'));
// const UiSwiper = lazy(() => import('./pages/ui/Swiper'));
// const UiTabs = lazy(() => import('./pages/ui/Tabs'));
// const UiToasts = lazy(() => import('./pages/ui/Toasts'));
// const UiTooltips = lazy(() => import('./pages/ui/Tooltips'));
// const UiTour = lazy(() => import('./pages/ui/Tour'));
// const UiTypography = lazy(() => import('./pages/ui/Typography'));
// const UtilitiesBorders = lazy(() => import('./pages/utilities/Borders'));
// const UtilitiesBreakpoints = lazy(() => import('./pages/utilities/Breakpoints'));
// const UtilitiesColors = lazy(() => import('./pages/utilities/Colors'));
// const UtilitiesFlexGrid = lazy(() => import('./pages/utilities/FlexGrid'));
// const UtilitiesHelpers = lazy(() => import('./pages/utilities/Helpers'));
// const UtilitiesPosition = lazy(() => import('./pages/utilities/Position'));
// const UtilitiesSpacing = lazy(() => import('./pages/utilities/Spacing'));
// const Widgets = lazy(() => import('./pages/Widgets'));

// Standalone pages — rendered OUTSIDE the app shell (own full-viewport chrome).
const standalone: Record<string, PageComponent> = {
  'login': SolarLogin,
  'pages/login': SolarLogin,
  'auth/login': SolarLogin,
  'auth/solar-login': SolarLogin,
  'auth/sign-in-basic': SolarLogin,
  'auth/sign-in-cover': SolarLogin,
  'auth/coming-soon': PagesComingSoon,
  'auth/create-password-basic': SolarLogin,
  'auth/create-password-cover': SolarLogin,
  'auth/lock-screen-basic': SolarLogin,
  'auth/lock-screen-cover': SolarLogin,
  'auth/maintenance': PagesComingSoon,
  'auth/reset-password-basic': SolarLogin,
  'auth/reset-password-cover': SolarLogin,
  'auth/sign-up-basic': SolarLogin,
  'auth/sign-up-cover': SolarLogin,
  'auth/two-step-basic': SolarLogin,
  'auth/two-step-cover': SolarLogin,
  'error/401': Error401,
  'error/403': Error403,
  'error/404': Error404,
  'error/500': Error500,
  'error/503': Error503,
  'pages/coming-soon': PagesComingSoon,
  'pages/landing': PagesLanding,
  'pages/logout': PagesLogout,
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
  // 'blog/blog-details': BlogBlogDetails,
  // 'blog/create': BlogCreate,
  // 'blog/list': BlogList,
  // 'charts/apex-area': ChartsApexArea,
  // 'charts/apex-bar': ChartsApexBar,
  // 'charts/apex-financial': ChartsApexFinancial,
  // 'charts/apex-line': ChartsApexLine,
  // 'charts/apex-mixed': ChartsApexMixed,
  // 'charts/apex-pie': ChartsApexPie,
  // 'charts/chartjs': ChartsChartjs,
  // 'charts/echarts': ChartsEcharts,
  // 'charts/sparklines': ChartsSparklines,
  // 'crm/companies': CrmCompanies,
  // 'crm/contacts': CrmContacts,
  // 'crm/deals': CrmDeals,
  // 'crm/leads': CrmLeads,
  // 'crypto/buy-sell': CryptoBuySell,
  // 'crypto/exchange': CryptoExchange,
  // 'crypto/marketcap': CryptoMarketcap,
  // 'crypto/transactions': CryptoTransactions,
  // 'crypto/wallet': CryptoWallet,
  // 'jammu/dashboard': JammuDashboard,
  // 'jammu/add-srt-new': JammuAddSRT70MWSingleCard,

  
    'dle/dashboard': DLEDashboard,
  'dle/bihar/ssl/amc/create-assign-light': BiharAMCSSLAssignLight,
  'dle/bihar/ssl/amc/view-assign-light': BiharAMCSSLViewAssignLight,
  'dle/bihar/ssl/amc/view-verify-light': BiharAMCSSLViewSurveyLight,
  'dle/bihar/ula/installation/dashboard': BiharULAInstallationDashboard,
  'dle/bihar/ula/installation/view': BiharULAInstallationViewData,
  'dle/up/ssl/amc/create-assign-light': UPAMCSSLAssignLights,
  'dle/up/ssl/amc/view-assign-light': UPAMCSSLViewAssignLight,
  'dle/up/ssl/amc/view-verify-light': UPAMCSSLViewSurveyLight,
  'dle/users': DLEManagementViewData,

  // 'assam': AssamDashboard,
  // 'assam/dashboard': AssamDashboard,
  // 'assam/installation': AssamInstallation,
  // 'assam/swp': AssamDashboard,
  // 'assam/swp/dashboard': AssamDashboard,
  // 'assam/swp/installation-request': AssamInstallationRequest,
  // 'assam/installation-request': AssamInstallationRequest,
  // 'assam/swp/installation-site': AssamInstallationSite,
  // 'assam/installation-site': AssamInstallationSite,
  // 'assam/swp/add-installation': AssamInstallationSite,
  // 'assam/add-installation': AssamInstallationSite,
  // 'assam/swp/view-installation': AssamViewInstallation,
  // 'assam/view-installation': AssamViewInstallation,
  // 'assam/swp/view-payment': AssamViewPayment,
  // 'assam/view-payment': AssamViewPayment,

  // ── Uttar Pradesh: Survey ──
  // 'up/survey/resco/assigned-survey': UPSurveyRescoAssignedSurvey,
  // 'up/survey/resco/add-resco': UPSurveyRescoAddResco,
  // 'up/survey/resco/view-resco': UPSurveyRescoViewResco,
  // 'up/survey/ssl/survey': UPSurveySSLSurvey,
  // 'up/survey/ssl/view-data': UPSurveySSLViewData,

  // ── Uttar Pradesh: Installation ──
  // 'up/installation/resco/dashboard': UPInstRescoDb,
  // 'up/installation/resco/assigned-sites': UPInstRescoAssigned,
  // 'up/installation/resco/install-site': UPInstRescoInstall,
  // 'up/installation/resco/installation-detail': UPInstRescoDetail,
  // 'up/installation/resco/claim-request': UPInstRescoClaim,
  // 'up/installation/resco/monthly-bill': UPInstRescoBill,
  // 'up/installation/ssl/dashboard': UPInstSSLDb,
  // 'up/installation/ssl/assigned-lights': UPInstSSLAssigned,
  // 'up/installation/ssl/install-light': UPInstSSLInstall,
  // 'up/installation/ssl/installation-detail': UPInstSSLDetail,
  // 'up/installation/ssl/claim-request': UPInstSSLClaim,
  // 'up/installation/kusum-c/dashboard': UPInstKCDb,
  // 'up/installation/kusum-c/installation-request': UPInstKCReq,
  // 'up/installation/kusum-c/install-site': UPInstKCInstall,
  // 'up/installation/kusum-c/view-installation': UPInstKCView,
  // 'up/installation/kusum-c/view-payment': UPInstKCPay,

  // ── Uttar Pradesh: AMC ──
  // 'up/amc/resco/view-assign-site': UPAMCRescoViewAssign,
  // 'up/amc/resco/pending-amc': UPAMCRescoPending,
  // 'up/amc/resco/completed-amc': UPAMCRescoCompleted,
  // 'up/amc/resco/payment': UPAMCRescoPay,
  // 'up/amc/kusum-c/view-assign-amc': UPAMCKCViewAssign,
  // 'up/amc/kusum-c/pending-amc': UPAMCKCPending,
  // 'up/amc/kusum-c/completed-amc': UPAMCKCCompleted,
  // 'up/amc/kusum-b/view-assign-amc': UPAMCKBViewAssign,
  // 'up/amc/kusum-b/pending-amc': UPAMCKBPending,
  // 'up/amc/kusum-b/completed-amc': UPAMCKBCompleted,
  // 'up/amc/powerpack/view-assign-amc': UPAMCPPViewAssign,
  // 'up/amc/powerpack/pending-amc': UPAMCPPPending,
  // 'up/amc/powerpack/completed-amc': UPAMCPPCompleted,
  // 'up/amc/ongrid/view-assign-amc': UPAMCOngridViewAssign,
  // 'up/amc/ongrid/pending-amc': UPAMCOngridPending,
  // 'up/amc/ongrid/completed-amc': UPAMCOngridCompleted,
  // 'up/amc/offgrid/view-assign-amc': UPAMCOffgridViewAssign,
  // 'up/amc/offgrid/pending-amc': UPAMCOffgridPending,
  // 'up/amc/offgrid/completed-amc': UPAMCOffgridCompleted,
  // 'up/amc/ssl/view-assign-light': UPAMCSSLViewAssign,
  // 'up/amc/ssl/pending-amc': UPAMCSSLPending,
  // 'up/amc/ssl/completed-amc': UPAMCSSLCompleted,
  // 'up/amc/ssl/payment': UPAMCSSLPay,
  // 'up/amc/ssl-18w/view-assign-light': UPAMCSSL18WViewAssign,
  // 'up/amc/ssl-18w/pending-amc': UPAMCSSL18WPending,
  // 'up/amc/ssl-18w/completed-amc': UPAMCSSL18WCompleted,
  // 'up/amc/ssl-18w/payment': UPAMCSSL18WPay,

  // // ── Uttar Pradesh: Complaint ──
  // 'up/complaint/resco/add-complaint': UPComplaintRescoAdd,
  // 'up/complaint/resco/view-complaint': UPComplaintRescoView,
  // 'up/complaint/resco/assigned-complaint': UPComplaintRescoAssigned,
  // 'up/complaint/ssl/add-complaint': UPComplaintSSLAdd,
  // 'up/complaint/ssl/view-complaint': UPComplaintSSLView,
  // 'up/complaint/ssl/assigned-complaint': UPComplaintSSLAssigned,
  // 'up/complaint/kusum-c/add-complaint': UPComplaintKCAdd,
  // 'up/complaint/kusum-c/view-complaint': UPComplaintKCView,
  // 'up/complaint/kusum-c/assigned-complaint': UPComplaintKCAssigned,
  // 'up/complaint/kusum-b/add-complaint': UPComplaintKBAdd,
  // 'up/complaint/kusum-b/view-complaint': UPComplaintKBView,
  // 'up/complaint/kusum-b/assigned-complaint': UPComplaintKBAssigned,
  // 'up/complaint/ongrid/add-complaint': UPComplaintOngridAdd,
  // 'up/complaint/ongrid/view-complaint': UPComplaintOngridView,
  // 'up/complaint/ongrid/assigned-complaint': UPComplaintOngridAssigned,
  // 'up/complaint/offgrid/add-complaint': UPComplaintOffgridAdd,
  // 'up/complaint/offgrid/view-complaint': UPComplaintOffgridView,
  // 'up/complaint/offgrid/assigned-complaint': UPComplaintOffgridAssigned,
  // 'up/complaint/powerpack/add-complaint': UPComplaintPPAdd,
  // 'up/complaint/powerpack/view-complaint': UPComplaintPPView,
  // 'up/complaint/powerpack/assigned-complaint': UPComplaintPPAssigned,
  // 'up/complaint/srlmsrt/add-complaint': UPComplaintSRLMAdd,
  // 'up/complaint/srlmsrt/view-complaint': UPComplaintSRLMView,
  // 'up/complaint/srlmsrt/assigned-complaint': UPComplaintSRLMAssigned,


  //   // ── Jammu ──
  // 'jammu/survey/resco/assign-survey': JMSurveyRescoAssign,
  // 'jammu/survey/resco/pending-survey': JMSurveyRescoPending,
  // 'jammu/survey/resco/view-survey': JMSurveyRescoView,
  // 'jammu/survey/srt-70mw/add-srt': JammuAddSRT70MWSingleCard,
  // 'jammu/survey/srt-70mw/view-data': JMSurveySRTView,

  // 'jammu/installation/resco/dashboard': JMInstRescoDb,
  // 'jammu/installation/resco/assigned-sites': JMInstRescoAssigned,
  // 'jammu/installation/resco/install-site': JMInstRescoInstall,
  // 'jammu/installation/resco/installation-details': JMInstRescoDetail,
  // 'jammu/installation/resco/claim-request': JMInstRescoClaim,

  // 'jammu/installation/srt-70mw/dashboard': JammuDashboard,
  // 'jammu/installation/srt-70mw/assign-site': JMInstSRTAssign,
  // 'jammu/installation/srt-70mw/install-sites': JMInstSRTInstall,
  // 'jammu/installation/srt-70mw/installation-details': JMInstSRTDetail,
  // 'jammu/installation/srt-70mw/claim-request': JMInstSRTClaim,

  // 'jammu/installation/ssl/dashboard': JMInstSSLDb,
  // 'jammu/installation/ssl/assign-lights': JMInstSSLAssign,
  // 'jammu/installation/ssl/install-lights': JMInstSSLInstall,
  // 'jammu/installation/ssl/installation-details': JMInstSSLDetail,
  // 'jammu/installation/ssl/claim-request': JMInstSSLClaim,

  // 'jammu/installation/swp/dashboard': JMInstSWPDb,
  // 'jammu/installation/swp/installation-request': JMInstSWPReq,
  // 'jammu/installation/swp/installation-site': JMInstSWPSite,
  // 'jammu/installation/swp/view-installation': JMInstSWPView,
  // 'jammu/installation/swp/view-payment': JMInstSWPPay,

  // 'jammu/installation-expenses/srt-70mw/request-expenses': JMExpRequest,
  // 'jammu/installation-expenses/srt-70mw/view-expenses': JMExpView,
  // 'jammu/installation-expenses/srt-70mw/view-payments': JMExpPay,

  // 'jammu/amc/resco/assign-survey': JMAMCRescoAssign,
  // 'jammu/amc/resco/pending-survey': JMAMCRescoPending,
  // 'jammu/amc/resco/view-survey': JMAMCRescoView,
  // 'jammu/amc/ssl/view-assign-amc': JMAMCSSLViewAssign,

  // 'dashboards/solar-erp': JammuDashboard,
  // 'dashboards/erp': JammuDashboard,
  // 'dashboards/analytics': DashboardsAnalytics,
  // 'dashboards/crm': DashboardsCrm,
  // 'dashboards/crypto': DashboardsCrypto,
  // 'dashboards/ecommerce': DashboardsEcommerce,
  // 'dashboards/finance': DashboardsFinance,
  // 'dashboards/healthcare': DashboardsHealthcare,
  // 'dashboards/hr': DashboardsHr,
  // 'dashboards/jobs': DashboardsJobs,
  // 'dashboards/lms': DashboardsLms,
  // 'dashboards/nft': DashboardsNft,
  // 'dashboards/podcast': DashboardsPodcast,
  // 'dashboards/pos': DashboardsPos,
  // 'dashboards/projects': DashboardsProjects,
  // 'dashboards/school': DashboardsSchool,
  // 'dashboards/social': DashboardsSocial,
  // 'dashboards/stocks': DashboardsStocks,
  // 'docs/index': DocsIndex,
  // 'ecommerce/add-product': EcommerceAddProduct,
  // 'ecommerce/cart': EcommerceCart,
  // 'ecommerce/checkout': EcommerceCheckout,
  // 'ecommerce/create-invoice': EcommerceCreateInvoice,
  // 'ecommerce/customer-details': EcommerceCustomerDetails,
  // 'ecommerce/customers': EcommerceCustomers,
  // 'ecommerce/edit-product': EcommerceEditProduct,
  // 'ecommerce/invoice-details': EcommerceInvoiceDetails,
  // 'ecommerce/invoices': EcommerceInvoices,
  // 'ecommerce/order-details': EcommerceOrderDetails,
  // 'ecommerce/order-success': EcommerceOrderSuccess,
  // 'ecommerce/orders': EcommerceOrders,
  // 'ecommerce/product-details': EcommerceProductDetails,
  // 'ecommerce/products': EcommerceProducts,
  // 'ecommerce/sellers': EcommerceSellers,
  // 'forms/advanced': FormsAdvanced,
  // 'forms/editor': FormsEditor,
  // 'forms/elements': FormsElements,
  // 'forms/file-upload': FormsFileUpload,
  // 'forms/floating-labels': FormsFloatingLabels,
  // 'forms/input-masks': FormsInputMasks,
  // 'forms/layouts': FormsLayouts,
  // 'forms/pickers': FormsPickers,
  // 'forms/select': FormsSelect,
  // 'forms/validation': FormsValidation,
  // 'forms/wizard': FormsWizard,
  // 'icons/brands': IconsBrands,
  // 'icons/line': IconsLine,
  // 'icons/solid': IconsSolid,
  // 'icons/tabler': IconsTabler,
  // 'jobs/candidate-details': JobsCandidateDetails,
  // 'jobs/job-details': JobsJobDetails,
  // 'jobs/job-post': JobsJobPost,
  // 'jobs/list': JobsList,
  // 'jobs/search-candidate': JobsSearchCandidate,
  // 'jobs/search-company': JobsSearchCompany,
  // 'jobs/search-jobs': JobsSearchJobs,
  // 'maps/google': MapsGoogle,
  // 'maps/leaflet': MapsLeaflet,
  // 'nft/create-nft': NftCreateNft,
  // 'nft/live-auction': NftLiveAuction,
  // 'nft/marketplace': NftMarketplace,
  // 'nft/nft-details': NftNftDetails,
  // 'nft/wallet': NftWallet,
  // 'pages/activity-log': PagesActivityLog,
  // 'pages/billing': PagesBilling,
  // 'pages/events': PagesEvents,
  // 'pages/faq': PagesFaq,
  // 'pages/nested-menu': PagesNestedMenu,
  // 'pages/notifications': PagesNotifications,
  // 'pages/pricing': PagesPricing,
  // 'pages/privacy': PagesPrivacy,
  // 'pages/profile': PagesProfile,
  // 'pages/profile-settings': PagesProfileSettings,
  // 'pages/search-results': PagesSearchResults,
  // 'pages/starter': PagesStarter,
  // 'pages/support': PagesSupport,
  // 'pages/sweet-alerts': PagesSweetAlerts,
  // 'pages/team': PagesTeam,
  // 'pages/terms': PagesTerms,
  // 'pages/testimonials': PagesTestimonials,
  // 'pages/timeline': PagesTimeline,
  // 'pages/tour': PagesTour,
  // 'projects/create': ProjectsCreate,
  // 'projects/list': ProjectsList,
  // 'projects/overview': ProjectsOverview,
  // 'tables/basic': TablesBasic,
  // 'tables/data-tables': TablesDataTables,
  // 'tables/editable': TablesEditable,
  // 'tables/gridjs': TablesGridjs,
  // 'ui/accordions': UiAccordions,
  // 'ui/alerts': UiAlerts,
  // 'ui/avatars': UiAvatars,
  // 'ui/badges': UiBadges,
  // 'ui/breadcrumb': UiBreadcrumb,
  // 'ui/button-group': UiButtonGroup,
  // 'ui/buttons': UiButtons,
  // 'ui/cards': UiCards,
  // 'ui/carousel': UiCarousel,
  // 'ui/draggable-cards': UiDraggableCards,
  // 'ui/dropdowns': UiDropdowns,
  // 'ui/images': UiImages,
  // 'ui/links': UiLinks,
  // 'ui/list-group': UiListGroup,
  // 'ui/modals': UiModals,
  // 'ui/navbar': UiNavbar,
  // 'ui/notifications': UiNotifications,
  // 'ui/offcanvas': UiOffcanvas,
  // 'ui/pagination': UiPagination,
  // 'ui/popovers': UiPopovers,
  // 'ui/progress': UiProgress,
  // 'ui/ratings': UiRatings,
  // 'ui/ribbons': UiRibbons,
  // 'ui/scrollspy': UiScrollspy,
  // 'ui/skeletons': UiSkeletons,
  // 'ui/sortable': UiSortable,
  // 'ui/spinners': UiSpinners,
  // 'ui/swiper': UiSwiper,
  // 'ui/tabs': UiTabs,
  // 'ui/toasts': UiToasts,
  // 'ui/tooltips': UiTooltips,
  // 'ui/tour': UiTour,
  // 'ui/typography': UiTypography,
  // 'utilities/borders': UtilitiesBorders,
  // 'utilities/breakpoints': UtilitiesBreakpoints,
  // 'utilities/colors': UtilitiesColors,
  // 'utilities/flex-grid': UtilitiesFlexGrid,
  // 'utilities/helpers': UtilitiesHelpers,
  // 'utilities/position': UtilitiesPosition,
  // 'utilities/spacing': UtilitiesSpacing,
  // 'widgets': Widgets,
};

// Suspense boundary per route: shows DashboardSkeleton loading placeholders
// matching the theme shapes (cards, lists, tables, charts) instead of a spinner.
const wrap = (C: PageComponent): ReactElement => (
  <Suspense fallback={<DashboardSkeleton />}>
    <C />
  </Suspense>
);

function RequireAccess({ slug, children }: { slug: string; children: ReactElement }) {
  if (!canAccessSlug(slug)) return <Navigate to="/dle/dashboard" replace />;
  return children;
}

const guarded = (slug: string, C: PageComponent): ReactElement => (
  <RequireAccess slug={slug}>{wrap(C)}</RequireAccess>
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
  {/* Login ke baad pehla page: DLE dashboard */}
  <Route index element={<Navigate to="/dle/dashboard" replace />} />
  {/* <Route index element={wrap(JammuDashboard)} /> */}
  {/* <Route path="dashboards/sales" element={wrap(Sales)} /> */}
  <Route element={<Navigate to="/dle/dashboard" replace />} />
  {Object.entries(shell).map(([slug, C]) => (
    <Route key={slug} path={slug} element={guarded(slug, C)} />
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
