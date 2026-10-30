import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { canAccessState } from '../../services/stateAccess';
import './v-portal-sidebar.css';

interface VPortalItem {
  title: string;
  to: string;
}

interface VPortalSubGroup {
  id: string;
  title: string;
  items: VPortalItem[];
}

interface VPortalCategory {
  id: string;
  title: string;
  icon: 'survey' | 'installation' | 'expenses' | 'amc' | 'complaints';
  subgroups: VPortalSubGroup[];
}

interface VPortalSection {
  section: string;
  state: string;
  categories: VPortalCategory[];
}

const V_PORTAL_NAVIGATION: VPortalSection[] = [
  /* ═══════════════════ UTTAR PRADESH ═══════════════════ */
  {
    section: 'Uttar Pradesh',
    state: 'up',
    categories: [
      {
        id: 'up.survey',
        title: 'Survey',
        icon: 'survey',
        subgroups: [
          {
            id: 'up.survey.srt',
            title: 'SRT',
            items: [
              { title: 'Add Survey', to: '/v/up/srt-surveys/create' },
              { title: 'View Survey', to: '/v/up/srt-surveys/view' },
            ],
          },
          {
            id: 'up.survey.resco',
            title: 'Resco',
            items: [
              { title: 'Assigned Survey', to: '/v/up/view-assigned-resco-survey' },
              { title: 'Add Resco', to: '/v/up/resco-survey' },
              { title: 'View Resco', to: '/v/up/view-resco-survey' },
            ],
          },
          {
            id: 'up.survey.ssl',
            title: 'SSL',
            items: [
              { title: 'Survey', to: '/v/edit-ssl' },
              { title: 'View Data', to: '/v/view-upssl' },
            ],
          },
        ],
      },
      {
        id: 'up.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'up.installation.resco',
            title: 'Resco',
            items: [
              { title: 'Dashboard', to: '/v/up/resco-installation-dashboard' },
              { title: 'Assigned Sites', to: '/v/up/resco-view-assign-installation-sites' },
              { title: 'Install Site', to: '/v/up/resco-install-site' },
              { title: 'Installation Detail', to: '/v/up/resco-view-install-site' },
              { title: 'Claim Request', to: '/v/up/resco-installation-claim' },
              { title: 'Monthly Bill', to: '/v/up/resco-view-install' },
            ],
          },
          {
            id: 'up.installation.ssl',
            title: 'SSL',
            items: [
              { title: 'Dashboard', to: '/v/up/ssl-18w-installation-dashboard' },
              { title: 'Assigned Lights', to: '/v/up/view-18w-assign-installation-sites' },
              { title: 'Install Light', to: '/v/up/ssl-install-18w-light' },
              { title: 'Installation Detail', to: '/v/up/ssl-view-installed-18w-light' },
              { title: 'Claim Request', to: '/v/up/ssl-view-installation-18w-claim' },
            ],
          },
          {
            id: 'up.installation.kusum-c',
            title: 'Kusum C',
            items: [
              { title: 'Dashboard', to: '/v/up/kusum-c-installation-dashboard' },
              { title: 'Installation Request', to: '/v/up/view-kusum-c-assign-installation-sites' },
              { title: 'Install Site', to: '/v/up/install-kusum-c-site' },
              { title: 'View Installation', to: '/v/up/view-kusum-c-install-site' },
              { title: 'View Payment', to: '/v/up/kusum-c-installation-claim' },
            ],
          },
        ],
      },
      {
        id: 'up.amc',
        title: 'AMC',
        icon: 'amc',
        subgroups: [
          {
            id: 'up.amc.resco',
            title: 'Resco',
            items: [
              { title: 'View Assign Site', to: '/v/up-resco-amc-view-assign-site' },
              { title: 'Pending AMC', to: '/v/up-resco-amc-create-site' },
              { title: 'Completed AMC', to: '/v/up-resco-amc-view-site' },
              { title: 'Payment', to: '/v/up-resco-amc-claim-site' },
            ],
          },
          {
            id: 'up.amc.kusum-c',
            title: 'Kusum C',
            items: [
              { title: 'View Assign AMC', to: '/v/up/kusumc/amc/fetch-view-assign-site' },
              { title: 'Pending AMC', to: '/v/up/kusumc/amc/assign-site' },
              { title: 'Completed AMC', to: '/v/up/kusumc/amc/completed-details' },
            ],
          },
          {
            id: 'up.amc.kusum-b',
            title: 'Kusum B',
            items: [
              { title: 'View Assign AMC', to: '/v/up/kusumb/amc/amc/fetch-view-assign-site' },
              { title: 'Pending AMC', to: '/v/up/kusumb/amc/assign-site' },
              { title: 'Completed AMC', to: '/v/up/kusumb/amc/completed-details' },
            ],
          },
          {
            id: 'up.amc.powerpack',
            title: 'Power Pack',
            items: [
              { title: 'View Assign AMC', to: '/v/up/powerpack/amc/amc/fetch-view-assign-site' },
              { title: 'Pending AMC', to: '/v/up/powerpack/amc/assign-site' },
              { title: 'Completed AMC', to: '/v/up/powerpack/amc/completed-details' },
            ],
          },
          {
            id: 'up.amc.ongrid',
            title: 'Ongrid',
            items: [
              { title: 'View Assign AMC', to: '/v/up/ongrid/amc/amc/fetch-view-assign-site' },
              { title: 'Pending AMC', to: '/v/up/ongrid/amc/assign-site' },
              { title: 'Completed AMC', to: '/v/up/ongrid/amc/completed-details' },
            ],
          },
          {
            id: 'up.amc.offgrid',
            title: 'Offgrid',
            items: [
              { title: 'View Assign AMC', to: '/v/up/offgrid/amc/amc/fetch-view-assign-site' },
              { title: 'Pending AMC', to: '/v/up/offgrid/amc/assign-site' },
              { title: 'Completed AMC', to: '/v/up/offgrid/amc/completed-details' },
            ],
          },
          {
            id: 'up.amc.ssl',
            title: 'SSL',
            items: [
              { title: 'View Assign Light', to: '/v/up-ssl-amc-view-assign-light' },
              { title: 'Pending AMC', to: '/v/up-ssl-amc-create-light' },
              { title: 'Completed AMC', to: '/v/up-ssl-amc-view-light' },
              { title: 'Payment', to: '/v/up-ssl-amc-claim-light' },
            ],
          },
          {
            id: 'up.amc.ssl-18w',
            title: 'SSL 18W',
            items: [
              { title: 'View Assign Light', to: '/v/up-ssl18w-amc-view-assign-light' },
              { title: 'Pending AMC', to: '/v/up-ssl18w-amc-create-light' },
              { title: 'Completed AMC', to: '/v/up-ssl18w-amc-view-light' },
              { title: 'Payment', to: '/v/up-ssl18w-amc-claim-light' },
            ],
          },
        ],
      },
      {
        id: 'up.complaint',
        title: 'Complaint',
        icon: 'complaints',
        subgroups: [
          {
            id: 'up.complaint.resco',
            title: 'Resco',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/resco-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/resco-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/resco-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.ssl',
            title: 'SSL',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/ssl-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/ssl-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/ssl-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.kusum-c',
            title: 'Kusum C',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/swp-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/swp-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/swp-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.kusum-b',
            title: 'Kusum B',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/kusumb-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/kusumb-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/kusumb-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.ongrid',
            title: 'Ongrid',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/ongrid-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/ongrid-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/ongrid-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.offgrid',
            title: 'Offgrid',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/offgrid-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/offgrid-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/offgrid-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.powerpack',
            title: 'Power Pack',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/powerpack/add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/powerpack-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/powerpack-assign-complaint' },
            ],
          },
          {
            id: 'up.complaint.srlmsrt',
            title: 'SRLMSRT',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/up/srlmsrt/add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/up/srlmsrt/view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/up/srlmsrt/assign-complaint' },
            ],
          },
        ],
      },
    ],
  },

  /* ═══════════════════ BIHAR ═══════════════════ */
  {
    section: 'Bihar',
    state: 'bihar',
    categories: [
      {
        id: 'bihar.survey',
        title: 'Survey',
        icon: 'survey',
        subgroups: [
          {
            id: 'bihar.survey.srt200mw',
            title: 'SRT200MW',
            items: [
              { title: 'Add Data', to: '/v/bihar/srt200mw-survey' },
              { title: 'View Data', to: '/v/bihar/view-srt200mw-survey' },
            ],
          },
          {
            id: 'bihar.survey.ula',
            title: 'ULA',
            items: [
              { title: 'Add Data', to: '/v/bihar/ula-surveys/create' },
              { title: 'View Data', to: '/v/bihar/ula-surveys/view' },
            ],
          },
        ],
      },
      {
        id: 'bihar.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'bihar.installation.ssl',
            title: 'SSL',
            items: [
              { title: 'Dashboard', to: '/v/ssl/installation-dashboard' },
              { title: 'Assigned Lights', to: '/v/ssl/view-assigned-ssl-site' },
              { title: 'Install Light', to: '/v/ssl/update-ssl-site-deatils' },
              { title: 'Installation Detail', to: '/v/ssl/view-ssl-complete-site' },
              { title: 'Claim Request', to: '/v/ssl/view-claim-request-deatils' },
              { title: 'Supply Inspection', to: '/v/bihar/ssl-light-supply-inspection' },
              { title: 'Installation Inspection', to: '/v/bihar/ssl-light-installation-inspection' },
            ],
          },
          {
            id: 'bihar.installation.srt',
            title: 'SRT',
            items: [
              { title: 'Dashboard', to: '/v/bihar/vendor-srt-installation-dashboard' },
              { title: 'Request Accept', to: '/v/srt/viewassignsite' },
              { title: 'Installation Details', to: '/v/srt/installationsite' },
              { title: 'View Installation', to: '/v/srt/allassignsite' },
              { title: 'Claim Request', to: '/v/srt/paymentsrtVendor' },
            ],
          },
          {
            id: 'bihar.installation.ula',
            title: 'ULA',
            items: [
              { title: 'Dashboard', to: '/v/bihar/ula-installation-dashboard' },
              { title: 'Request Accept', to: '/v/bihar/ula-installation-view-assign-site' },
              { title: 'Installation Details', to: '/v/bihar/ula-installation-pending-structure-site' },
              { title: 'View Installation', to: '/v/bihar/ula-installation-view-site' },
              { title: 'Add Payment', to: '/v/bihar/ula-installation-claim' },
              { title: 'Payment', to: '/v/bihar/ula-installation-view-payment' },
            ],
          },
        ],
      },
      {
        id: 'bihar.amc',
        title: 'AMC',
        icon: 'amc',
        subgroups: [
          {
            id: 'bihar.amc.ssl',
            title: 'SSL',
            items: [
              { title: 'Add Data', to: '/v/edit-biharssl' },
              { title: 'View Data', to: '/v/view-biharssl' },
              { title: 'Complaint Raised', to: '/v/ssl/view-bihar-ssl-complaint' },
            ],
          },
          {
            id: 'bihar.amc.srt',
            title: 'SRT',
            items: [
              { title: 'Add Data', to: '/v/bihar-add-srt-amc' },
              { title: 'View Data', to: '/v/bihar-view-srt-amc' },
              { title: 'Complaint Raised', to: '/v/bihar-view-srt-amc-complaint' },
            ],
          },
        ],
      },
      {
        id: 'bihar.complaints',
        title: 'Complaints',
        icon: 'complaints',
        subgroups: [
          {
            id: 'bihar.complaints.ssl',
            title: 'SSL',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/bihar/ssl-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/bihar/ssl-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/bihar/ssl-assign-complaint' },
            ],
          },
          {
            id: 'bihar.complaints.srt',
            title: 'SRT',
            items: [
              { title: 'Add Complaint', to: '/v/complaint/bihar/srt-add-complaint' },
              { title: 'View Complaint', to: '/v/complaint/bihar/srt-view-complaint' },
              { title: 'Assigned Complaint', to: '/v/complaint/bihar/srt-assign-complaint' },
            ],
          },
        ],
      },
    ],
  },

  /* ═══════════════════ ASSAM ═══════════════════ */
  {
    section: 'Assam',
    state: 'assam',
    categories: [
      {
        id: 'assam.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'assam.installation.swp',
            title: 'SWP',
            items: [
              { title: 'Dashboard', to: '/v/assam/installation/swp/dashboard' },
              { title: 'Installation Request', to: '/v/assam/installation/swp/request' },
              { title: 'Installation Site', to: '/v/assam/installation/swp/site' },
              { title: 'View Installation', to: '/v/assam/installation/swp/view' },
              { title: 'View Payment', to: '/v/assam/installation/swp/payment' },
            ],
          },
        ],
      },
    ],
  },

    /* ═══════════════════ KARNATAKA ═══════════════════ */
  {
    section: 'Karnataka',
    state: 'karnataka',
    categories: [
      {
        id: 'karnataka.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'karnataka.installation.swp',
            title: 'SWP',
            items: [
              { title: 'Dashboard', to: '/v/karnataka/installation/swp/dashboard' },
              { title: 'Installation Request', to: '/v/karnataka/installation/swp/request' },
              { title: 'Installation Site', to: '/v/karnataka/installation/swp/site' },
              { title: 'View Installation', to: '/v/karnataka/installation/swp/view' },
              { title: 'Add Payment', to: '/v/karnataka/installation/swp/add-payment' },
              { title: 'View Payment', to: '/v/karnataka/installation/swp/payment' },
              { title: 'Material Details', to: '/v/karnataka/installation/swp/material-details' },
            ],
          },
        ],
      },
    ],
  },




  /* ═══════════════════ PUNJAB ═══════════════════ */
  {
    section: 'Punjab',
    state: 'punjab',
    categories: [
      {
        id: 'punjab.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'punjab.installation.ssl',
            title: 'SSL',
            items: [
              { title: 'Dashboard', to: '/v/punjab/ssl/installation/dashboard' },
              { title: 'Assigned Lights', to: '/v/punjab/ssl/installation/view-assigned-light' },
              { title: 'Install Light', to: '/v/punjab/ssl/installation/update-light-deatils' },
              { title: 'Installation Detail', to: '/v/punjab/ssl/installation/complete-light' },
            ],
          },
        ],
      },
    ],
  },

  /* ═══════════════════ ARUNACHAL PRADESH ═══════════════════ */
  {
    section: 'Arunachal Pradesh',
    state: 'arunachal',
    categories: [
      {
        id: 'arunachal.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'arunachal.installation.shl',
            title: 'SHL',
            items: [
              { title: 'Dashboard', to: '/v/arunachal/shl/installation/dashboard' },
              { title: 'Assigned Lights', to: '/v/arunachal/shl/installation/view-assigned-light' },
              { title: 'Install Light', to: '/v/arunachal/shl/installation/install-light' },
              { title: 'Installation Detail', to: '/v/arunachal/shl/installation/view-installation' },
            ],
          },
        ],
      },
    ],
  },

  /* ═══════════════════ GOA ═══════════════════ */
  {
    section: 'Goa',
    state: 'goa',
    categories: [
      {
        id: 'goa.survey',
        title: 'Survey',
        icon: 'survey',
        subgroups: [
          {
            id: 'goa.survey.srt',
            title: 'SRT',
            items: [
              { title: 'Add Data', to: '/v/goa/srt-survey' },
              { title: 'View Data', to: '/v/goa/view-survey' },
            ],
          },
        ],
      },
      {
        id: 'goa.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'goa.installation.srt',
            title: 'SRT',
            items: [
              { title: 'Dashboard', to: '/v/goa/vendor-srt-installation-dashboard' },
              { title: 'Installation Request', to: '/v/goa/srt/viewassignsite' },
              { title: 'Installation Details', to: '/v/goa/srt/installationsite' },
              { title: 'View Installation', to: '/v/goa/srt/allassignsite' },
              { title: 'Claim Request', to: '/v/goa/srt/paymentsrtVendor' },
            ],
          },
        ],
      },
      {
        id: 'goa.amc',
        title: 'AMC',
        icon: 'amc',
        subgroups: [
          {
            id: 'goa.amc.srt',
            title: 'SRT',
            items: [
              { title: 'Add Data', to: '/v/goa-add-srt-amc' },
              { title: 'View Data', to: '/v/goa-view-srt-amc' },
              { title: 'Complaint Raised', to: '/v/goa-view-srt-amc-complaint' },
            ],
          },
        ],
      },
    ],
  },


    /* ═══════════════════ JAMMU & KASHMIR ═══════════════════ */
  {
    section: 'Jammu & Kashmir',
    state: 'jammu',
    categories: [
      {
        id: 'jammu.survey',
        title: 'Survey',
        icon: 'survey',
        subgroups: [
          {
            id: 'jammu.survey.resco',
            title: 'Resco',
            items: [
              { title: 'Assign Survey', to: '/v/jammu/survey/resco/assign-survey' },
              { title: 'Pending Survey', to: '/v/jammu/survey/resco/pending-survey' },
              { title: 'View Survey', to: '/v/jammu/survey/resco/view-survey' },
            ],
          },
          {
            id: 'jammu.survey.srt-70mw',
            title: 'SRT 70MW',
            items: [
              { title: 'Add 70MW SRT', to: '/v/jammu/survey/srt-70mw/add-srt' },
              { title: 'View 70MW SRT', to: '/v/jammu/survey/srt-70mw/view-data' },
            ],
          },
        ],
      },
      {
        id: 'jammu.installation',
        title: 'Installation',
        icon: 'installation',
        subgroups: [
          {
            id: 'jammu.installation.resco',
            title: 'Resco',
            items: [
              { title: 'Dashboard', to: '/v/jammu/installation/resco/dashboard' },
              { title: 'Assigned Sites', to: '/v/jammu/installation/resco/assigned-sites' },
              { title: 'Install Site', to: '/v/jammu/installation/resco/install-site' },
              { title: 'Installation Details', to: '/v/jammu/installation/resco/installation-details' },
              { title: 'Claim Request', to: '/v/jammu/installation/resco/claim-request' },
            ],
          },
          {
            id: 'jammu.installation.srt-70mw',
            title: 'SRT 70MW',
            items: [
              { title: 'Dashboard', to: '/v/jammu/installation/srt-70mw/dashboard' },
              { title: 'Assign Site', to: '/v/jammu/installation/srt-70mw/assign-site' },
              { title: 'Install Sites', to: '/v/jammu/installation/srt-70mw/install-sites' },
              { title: 'Installation Details', to: '/v/jammu/installation/srt-70mw/installation-details' },
              { title: 'Claim Request', to: '/v/jammu/installation/srt-70mw/claim-request' },
            ],
          },
          {
            id: 'jammu.installation.ssl',
            title: 'SSL',
            items: [
              { title: 'Dashboard', to: '/v/jammu/installation/ssl/dashboard' },
              { title: 'Assign Lights', to: '/v/jammu/installation/ssl/assign-lights' },
              { title: 'Install Lights', to: '/v/jammu/installation/ssl/install-lights' },
              { title: 'Installation Details', to: '/v/jammu/installation/ssl/installation-details' },
              { title: 'Claim Request', to: '/v/jammu/installation/ssl/claim-request' },
            ],
          },
          {
            id: 'jammu.installation.swp',
            title: 'SWP',
            items: [
              { title: 'Dashboard', to: '/v/jammu/installation/swp/dashboard' },
              { title: 'Installation Request', to: '/v/jammu/installation/swp/installation-request' },
              { title: 'Installation Site', to: '/v/jammu/installation/swp/installation-site' },
              { title: 'View Installation', to: '/v/jammu/installation/swp/view-installation' },
              { title: 'View Payment', to: '/v/jammu/installation/swp/view-payment' },
            ],
          },
        ],
      },
      {
        id: 'jammu.expenses',
        title: 'Installation Expenses',
        icon: 'expenses',
        subgroups: [
          {
            id: 'jammu.expenses.srt-70mw',
            title: 'SRT 70MW',
            items: [
              { title: 'Request Expenses', to: '/v/jammu/installation-expenses/srt-70mw/request-expenses' },
              { title: 'View Expenses', to: '/v/jammu/installation-expenses/srt-70mw/view-expenses' },
              { title: 'View Payments', to: '/v/jammu/installation-expenses/srt-70mw/view-payments' },
            ],
          },
        ],
      },
      {
        id: 'jammu.amc',
        title: 'AMC',
        icon: 'amc',
        subgroups: [
          {
            id: 'jammu.amc.resco',
            title: 'Resco',
            items: [
              { title: 'Assign Survey', to: '/v/jammu/amc/resco/assign-survey' },
              { title: 'Pending Survey', to: '/v/jammu/amc/resco/pending-survey' },
              { title: 'View Survey', to: '/v/jammu/amc/resco/view-survey' },
            ],
          },
          {
            id: 'jammu.amc.ssl',
            title: 'SSL',
            items: [
              { title: 'View Assign AMC', to: '/v/jammu/amc/ssl/view-assign-amc' },
            ],
          },
        ],
      },
    ],
  },
  
];

function VPIconBox({ icon }: { icon: 'survey' | 'installation' | 'expenses' | 'amc' | 'complaints' | 'dashboard' }) {
  switch (icon) {
    case 'dashboard':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
      );
    case 'survey':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--survey">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        </div>
      );
    case 'installation':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--installation">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      );
    case 'expenses':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--expenses">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      );
    case 'amc':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--amc">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      );
    case 'complaints':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--complaints">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      );
  }
}

export function VPortalSidebar({
  filter = '',
  onNavigate,
}: {
  filter?: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isDashboardActive =
    currentPath === '/v-dashboard' ||
    currentPath === '/vendor/dashboard' ||
    currentPath === '/vendor' ||
    currentPath === '/v-portal';

  return (
    <div className="vp-sidebar">
      {/* ── Primary V-Portal Dashboard Link ── */}
      <div className="vp-sb__item-wrapper" style={{ marginBottom: 10 }}>
        <Link
          to="/v-dashboard"
          className={`vp-sb__item-link vp-sb__item-link--dashboard ${isDashboardActive ? 'is-active' : ''}`}
          onClick={onNavigate}
          title="V-Portal Dashboard"
          data-tooltip="V-Portal Dashboard"
        >
          <VPIconBox icon="dashboard" />
          <span className="vp-sb__label">V-Dashboard</span>
          <span className="vp-sb__badge-pill">Overview</span>
        </Link>
      </div>

      {/* ── State Navigation Sections ── */}
      {V_PORTAL_NAVIGATION.map((sec) => {
        if (sec.state && !canAccessState(sec.state)) {
          return null;
        }

        const filteredCategories = sec.categories
          .map((cat) => {
            const filteredSubgroups = cat.subgroups
              .map((sub) => {
                const matchingItems = sub.items.filter(
                  (item) =>
                    !filter ||
                    item.title.toLowerCase().includes(filter.toLowerCase()) ||
                    sub.title.toLowerCase().includes(filter.toLowerCase()) ||
                    cat.title.toLowerCase().includes(filter.toLowerCase())
                );
                return matchingItems.length ? { ...sub, items: matchingItems } : null;
              })
              .filter(Boolean) as VPortalSubGroup[];

            return filteredSubgroups.length ? { ...cat, subgroups: filteredSubgroups } : null;
          })
          .filter(Boolean) as VPortalCategory[];

        if (!filteredCategories.length) return null;

        return (
          <div key={sec.section} className="vp-sb__section-group">
            <div className="vp-sb__section">
              <span className="vp-sb__section-title">{sec.section}</span>
            </div>
            {filteredCategories.map((cat) => (
              <VPortalCategoryItem
                key={cat.id}
                category={cat}
                currentPath={currentPath}
                filter={filter}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Level 1: Category (e.g. Installation, Survey, AMC, Complaint) */
function VPortalCategoryItem({
  category,
  currentPath,
  filter,
  onNavigate,
}: {
  category: VPortalCategory;
  currentPath: string;
  filter: string;
  onNavigate?: () => void;
}) {
  const hasActiveChild = category.subgroups.some((sub) =>
    sub.items.some((item) => currentPath === item.to || currentPath.replace(/^\/v\//, '/') === item.to.replace(/^\/v\//, '/'))
  );

  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild]);

  const isOpen = filter ? true : open;

  return (
    <div className="vp-sb__group">
      <button
        type="button"
        className={`vp-sb__item-btn vp-sb__item-btn--group ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={category.title}
        data-tooltip={category.title}
      >
        <VPIconBox icon={category.icon} />
        <span className="vp-sb__label">{category.title}</span>
        <svg
          className={`vp-sb__caret ${isOpen ? 'is-open' : ''}`}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* ── Collapsed Flyout Popover (Active only when rail is collapsed) ── */}
      <div className="vp-sb__flyout" role="menu" aria-label={category.title}>
        <div className="vp-sb__flyout-header">
          <span className="vp-sb__flyout-title">{category.title}</span>
        </div>
        <div className="vp-sb__flyout-list">
          {category.subgroups.map((sub) => (
            <div key={sub.id} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', padding: '2px 8px' }}>
                {sub.title}
              </div>
              {sub.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`vp-sb__flyout-link ${currentPath === item.to ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <svg className="vp-sb__leaf-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Smooth CSS Grid Accordion for Expanded/Mobile view ── */}
      <div className={`vp-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="vp-sb__collapse-inner">
          <div className="vp-sb__children-tree">
            {category.subgroups.map((sub) => (
              <VPortalSubgroupItem
                key={sub.id}
                subgroup={sub}
                currentPath={currentPath}
                filter={filter}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Level 2: Sub-group (e.g. SWP, Resco, SSL, Kusum C) */
function VPortalSubgroupItem({
  subgroup,
  currentPath,
  filter,
  onNavigate,
}: {
  subgroup: VPortalSubGroup;
  currentPath: string;
  filter: string;
  onNavigate?: () => void;
}) {
  const hasActiveLeaf = subgroup.items.some(
    (item) => currentPath === item.to || currentPath.replace(/^\/v\//, '/') === item.to.replace(/^\/v\//, '/')
  );

  const [open, setOpen] = useState(hasActiveLeaf);

  useEffect(() => {
    if (hasActiveLeaf) {
      setOpen(true);
    }
  }, [hasActiveLeaf]);

  const isOpen = filter ? true : open;

  return (
    <div className="vp-sb__subgroup-block" style={{ marginBottom: 4 }}>
      <button
        type="button"
        className={`vp-sb__sub-btn ${hasActiveLeaf ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={subgroup.title}
      >
        {/* Bullseye / target icon matching user image */}
        <svg className="vp-sb__sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
        </svg>
        <span className="vp-sb__label" style={{ fontWeight: 600 }}>{subgroup.title}</span>
        <svg
          className={`vp-sb__caret ${isOpen ? 'is-open' : ''}`}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Level 3: Leaf links container */}
      <div className={`vp-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="vp-sb__collapse-inner">
          <div className="vp-sb__leaf-tree">
            {subgroup.items.map((item) => {
              const active = currentPath === item.to || currentPath.replace(/^\/v\//, '/') === item.to.replace(/^\/v\//, '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`vp-sb__leaf-link ${active ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <svg className="vp-sb__leaf-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <span className="vp-sb__label">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VPortalSidebar;
