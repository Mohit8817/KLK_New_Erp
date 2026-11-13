import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { canAccessSlug, canAccessState } from '../../services/stateAccess';
import './vendor-management-sidebar.css';

interface NavLeaf {
  id: string;
  title: string;
  to: string;
  iconType?: 'assign' | 'view-assign' | 'view-survey' | 'analytics' | 'view-data';
  keywords?: string[];
}

interface NavSubGroup {
  id: string;
  title: string;
  tag?: string;
  children: NavLeaf[];
}

interface NavGroup {
  id: string;
  title: string;
  icon: 'dashboard' | 'amc' | 'installation' | 'management' | 'attendance' | 'survey';
  badge?: string;
  children: (NavLeaf | NavSubGroup)[];
}

interface NavSection {
  section: string;
  state?: string;
  items: (NavLeaf | NavGroup)[];
}

const VENDOR_SECTIONS: NavSection[] = [
  {
    section: 'VENDOR DASHBOARD',
    items: [
      {
        id: 'vm.dashboard',
        title: 'Dashboard',
        to: '/vendor-management',
        iconType: 'analytics',
        keywords: ['vendor', 'dashboard', 'overview', 'command center'],
      },
    ],
  },

<<<<<<< HEAD

=======
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
  {
    section: 'VENDOR · ASSAM',
    state: 'assam',
    items: [
      {
        id: 'grp.vm.assam.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.assam.inst.swp',
            title: 'Solar Water Pump',
            tag: 'SWP',
            children: [
              { id: 'vm.assam.swp.dashboard', title: 'Dashboard', to: '/vendor-management/assam/swp/dashboard', iconType: 'analytics' },
              { id: 'vm.assam.swp.assign', title: 'Assign Installation', to: '/vendor-management/assam/swp/assign-installation', iconType: 'assign' },
              { id: 'vm.assam.swp.view-assign', title: 'View Assign Installation', to: '/vendor-management/assam/swp/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.assam.swp.verify-install', title: 'Verify Installation', to: '/vendor-management/assam/swp/verify-installation', iconType: 'view-survey' },
              { id: 'vm.assam.swp.verify-doc', title: 'Verify Document', to: '/vendor-management/assam/swp/verify-document', iconType: 'view-data' },
              { id: 'vm.assam.swp.verify-claim', title: 'Verify Claim', to: '/vendor-management/assam/swp/verify-claim', iconType: 'view-data' },
              { id: 'vm.assam.swp.view-payment', title: 'View Payment', to: '/vendor-management/assam/swp/view-payment', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },


<<<<<<< HEAD
=======
  // Arunachal Pradesh
  {
    section: 'VENDOR · ARUNACHAL',
    state: 'arunachal',
    items: [
      {
        id: 'grp.vm.arunachal.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.arunachal.inst.shl',
            title: 'Solar Street Light (SHL)',
            tag: 'SHL',
            children: [
              { id: 'vm.arunachal.shl.dashboard', title: 'Dashboard', to: '/vendor-management/arunachal/shl/dashboard', iconType: 'analytics' },
              { id: 'vm.arunachal.shl.assign', title: 'Assign Lights', to: '/vendor-management/arunachal/shl/assign-light', iconType: 'assign' },
              { id: 'vm.arunachal.shl.view-assign', title: 'View Assign Lights', to: '/vendor-management/arunachal/shl/view-assign', iconType: 'view-assign' },
              { id: 'vm.arunachal.shl.verify', title: 'Verify Lights', to: '/vendor-management/arunachal/shl/verify', iconType: 'view-survey' },
            ],
          },
        ],
      },
    ],
  },
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6

  {

    section: 'VENDOR · ARUNACHAL',
    state: 'arunachal',
    items: [
      {
        id: 'grp.vm.arunachal.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.arunachal.inst.shl',
            title: 'Solar Street Light',
            tag: 'SHL',
            children: [
<<<<<<< HEAD
              { id: 'vm.arunachal.shl.dashboard', title: 'Dashboard', to: '/vendor-management/arunachal/shl/dashboard', iconType: 'analytics' },
              { id: 'vm.arunachal.shl.assign', title: 'Assign Installation', to: '/vendor-management/arunachal/shl/assign-installation', iconType: 'assign' },
              { id: 'vm.arunachal.shl.view-assign', title: 'View Assign Installation', to: '/vendor-management/arunachal/shl/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.arunachal.shl.verify-install', title: 'Verify Installation', to: '/vendor-management/arunachal/shl/verify-installation', iconType: 'view-survey' },
             
=======
              { id: 'vm.bihar.inst.view', title: 'Installation Desk', to: '/vendor-management/bihar/installation', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },

  {
    section: 'VENDOR · UTTAR PRADESH',
    state: 'up',
    items: [
      {
        id: 'grp.vm.up.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.up.inst.resco',
            title: 'Resco / SSL / Kusum C',
            tag: 'RESCO',
            children: [
              { id: 'vm.up.inst.view', title: 'Installation Desk', to: '/vendor-management/up/installation', iconType: 'view-data' },
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
            ],
          },
        ],
      },
    ],
  },

<<<<<<< HEAD
  
  // {
  //   section: 'VENDOR · BIHAR',
  //   state: 'bihar',
  //   items: [
  //     {
  //       id: 'grp.vm.bihar.inst',
  //       title: 'Installation System',
  //       icon: 'installation',
  //       children: [
  //         {
  //           id: 'grp.vm.bihar.inst.ssl',
  //           title: 'SSL / SRT / ULA',
  //           tag: 'SSL',
  //           children: [
  //             { id: 'vm.bihar.inst.view', title: 'Installation Desk', to: '/vendor-management/bihar/installation', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   section: 'VENDOR · UTTAR PRADESH',
  //   state: 'up',
  //   items: [
  //     {
  //       id: 'grp.vm.up.inst',
  //       title: 'Installation System',
  //       icon: 'installation',
  //       children: [
  //         {
  //           id: 'grp.vm.up.inst.resco',
  //           title: 'Resco / SSL / Kusum C',
  //           tag: 'RESCO',
  //           children: [
  //             { id: 'vm.up.inst.view', title: 'Installation Desk', to: '/vendor-management/up/installation', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },




=======
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
  {
    section: 'VENDOR · JAMMU',
    state: 'jammu',
    items: [
      {
        id: 'grp.vm.jammu.survey',
        title: 'Survey System',
        icon: 'survey',
        children: [
          {
            id: 'grp.vm.jammu.survey.srt',
            title: 'SRT 70MW Survey',
            tag: '70MW',
            children: [
              {
                id: 'vm.jammu.survey.srt.verify',
                title: 'Verify 70MW Survey',
                to: '/vendor-management/jammu/survey/srt-70mw/verify',
                iconType: 'view-survey',
                keywords: ['jammu', 'survey', 'srt', '70mw', 'verify', 'solar rooftop'],
              },
            ],
          },
          {
            id: 'grp.vm.jammu.survey.resco',
            title: 'Resco Survey',
            tag: 'RESCO',
            children: [
              {
                id: 'vm.jammu.survey.resco.dashboard',
                title: 'Resco Dashboard',
                to: '/vendor-management/jammu/survey/resco/dashboard',
                iconType: 'analytics',
                keywords: ['jammu', 'survey', 'resco', 'dashboard', 'analytics'],
              },
              {
                id: 'vm.jammu.survey.resco.assign',
                title: 'Assign Survey',
                to: '/vendor-management/jammu/survey/resco/assign',
                iconType: 'assign',
                keywords: ['jammu', 'survey', 'resco', 'assign', 'allocation'],
              },
              {
                id: 'vm.jammu.survey.resco.view-assign',
                title: 'Assign View Survey',
                to: '/vendor-management/jammu/survey/resco/view-assign',
                iconType: 'view-assign',
                keywords: ['jammu', 'survey', 'resco', 'view assign', 'assigned surveys'],
              },
              {
                id: 'vm.jammu.survey.resco.assigned-vendor',
                title: 'Assigned Survey Vendor',
                to: '/vendor-management/jammu/survey/resco/assigned-vendor',
                iconType: 'view-data',
                keywords: ['jammu', 'survey', 'resco', 'assigned vendor', 'conduct survey', 'audit'],
              },
              {
                id: 'vm.jammu.survey.resco.verify',
                title: 'Verify Survey',
                to: '/vendor-management/jammu/survey/resco/verify',
                iconType: 'view-survey',
                keywords: ['jammu', 'survey', 'resco', 'verify', 'bos', 'approval'],
              },
            ],
          },
        ],
      },
      {
        id: 'grp.vm.jammu.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
<<<<<<< HEAD
            id: 'grp.vm.jammu.inst.srt',
            title: 'SRT (70MW Rooftop)',
=======
            id: 'grp.vm.jammu.inst.70mw',
            title: '70MW / SSL / SWP',
            tag: '70MW',
            children: [
              { id: 'vm.jammu.inst.view', title: 'Installation Desk', to: '/vendor-management/jammu/installation', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },

  {
    section: 'VENDOR · KASHMIR',
    state: 'kashmir',
    items: [
      {
        id: 'grp.vm.kashmir.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.kashmir.inst.srt',
            title: '70MW Rooftop (SRT)',
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
            tag: 'SRT',
            children: [
              { id: 'vm.jammu.inst.srt.db', title: 'Dashboard', to: '/vendor-management/jammu/installation/srt-70mw/dashboard', iconType: 'analytics' },
              { id: 'vm.jammu.inst.srt.assign', title: 'Assign Sites', to: '/vendor-management/jammu/installation/srt-70mw/assign-sites', iconType: 'assign' },
              { id: 'vm.jammu.inst.srt.view-assign', title: 'View Assign Sites', to: '/vendor-management/jammu/installation/srt-70mw/view-assign-sites', iconType: 'view-assign' },
              { id: 'vm.jammu.inst.srt.verify', title: 'Verify Sites', to: '/vendor-management/jammu/installation/srt-70mw/verify-sites', iconType: 'view-survey' },
              { id: 'vm.jammu.inst.srt.claim', title: 'View Claim', to: '/vendor-management/jammu/installation/srt-70mw/view-claim', iconType: 'view-data' },
              { id: 'vm.jammu.inst.srt.payment', title: 'View Payment', to: '/vendor-management/jammu/installation/srt-70mw/view-payment', iconType: 'view-data' },
            ],
          },
<<<<<<< HEAD
=======
        ],
      },
    ],
  },

  {
    section: 'VENDOR · GOA',
    state: 'goa',
    items: [
      {
        id: 'grp.vm.goa.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
          {
            id: 'grp.vm.jammu.inst.ssl',
            title: 'SSL (Street Light)',
            tag: 'SSL',
            children: [
              { id: 'vm.jammu.inst.ssl.db', title: 'Dashboard', to: '/vendor-management/jammu/installation/ssl/dashboard', iconType: 'analytics' },
              { id: 'vm.jammu.inst.ssl.assign', title: 'Assign Light', to: '/vendor-management/jammu/installation/ssl/assign-lights', iconType: 'assign' },
              { id: 'vm.jammu.inst.ssl.view-assign', title: 'View Assign Light', to: '/vendor-management/jammu/installation/ssl/view-assign-lights', iconType: 'view-assign' },
              { id: 'vm.jammu.inst.ssl.verify', title: 'Verify Light', to: '/vendor-management/jammu/installation/ssl/verify-lights', iconType: 'view-survey' },
              { id: 'vm.jammu.inst.ssl.claim', title: 'Claim Request', to: '/vendor-management/jammu/installation/ssl/claim-request', iconType: 'view-data' },
              { id: 'vm.jammu.inst.ssl.payment', title: 'Payment Request', to: '/vendor-management/jammu/installation/ssl/payment-request', iconType: 'view-data' },
            ],
          },
<<<<<<< HEAD
=======
        ],
      },
    ],
  },

  {
    section: 'VENDOR · KARNATAKA',
    state: 'karnataka',
    items: [
      {
        id: 'grp.vm.karnataka.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
          {
            id: 'grp.vm.jammu.inst.swp',
            title: 'SWP (Water Pump)',
            tag: 'SWP',
            children: [
              { id: 'vm.jammu.inst.swp.db', title: 'Dashboard', to: '/vendor-management/jammu/installation/swp/dashboard', iconType: 'analytics' },
              { id: 'vm.jammu.inst.swp.assign', title: 'Assign Installation', to: '/vendor-management/jammu/installation/swp/assign-installation', iconType: 'assign' },
              { id: 'vm.jammu.inst.swp.view-assign', title: 'View Assign Installation', to: '/vendor-management/jammu/installation/swp/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.jammu.inst.swp.verify-inst', title: 'Verify Installation', to: '/vendor-management/jammu/installation/swp/verify-installation', iconType: 'view-survey' },
              { id: 'vm.jammu.inst.swp.verify-doc', title: 'Verify Document', to: '/vendor-management/jammu/installation/swp/verify-document', iconType: 'view-data' },
              { id: 'vm.jammu.inst.swp.verify-claim', title: 'Verify Claim', to: '/vendor-management/jammu/installation/swp/verify-claim', iconType: 'view-data' },
              { id: 'vm.jammu.inst.swp.payment', title: 'View Payment', to: '/vendor-management/jammu/installation/swp/view-payment', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.jammu.inst.resco',
            title: 'RESCO Installation',
            tag: 'RESCO',
            children: [
              { id: 'vm.jammu.inst.resco.db', title: 'Dashboard', to: '/vendor-management/jammu/installation/resco/dashboard', iconType: 'analytics' },
              { id: 'vm.jammu.inst.resco.assign', title: 'Assign Installation', to: '/vendor-management/jammu/installation/resco/assign-installation', iconType: 'assign' },
              { id: 'vm.jammu.inst.resco.view-assign', title: 'View Assign Installation', to: '/vendor-management/jammu/installation/resco/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.jammu.inst.resco.view-vendor', title: 'View Assign Vendor Installation', to: '/vendor-management/jammu/installation/resco/view-assign-vendor-installation', iconType: 'view-data' },
              { id: 'vm.jammu.inst.resco.verify-inst', title: 'Verify Installation', to: '/vendor-management/jammu/installation/resco/verify-installation', iconType: 'view-survey' },
              { id: 'vm.jammu.inst.resco.verify-doc', title: 'Verify Document', to: '/vendor-management/jammu/installation/resco/verify-document', iconType: 'view-data' },
              { id: 'vm.jammu.inst.resco.claim', title: 'View Claim', to: '/vendor-management/jammu/installation/resco/view-claim', iconType: 'view-data' },
              { id: 'vm.jammu.inst.resco.payment', title: 'View Payment', to: '/vendor-management/jammu/installation/resco/view-payment', iconType: 'view-data' },
              { id: 'vm.jammu.inst.resco.bills', title: 'View Created Bills', to: '/vendor-management/jammu/installation/resco/view-bills', iconType: 'view-data' },
            ],
          },
        ],
      },
      {
        id: 'grp.vm.jammu.expenses',
        title: 'Installation Expenses',
        icon: 'management',
        children: [
          {
            id: 'grp.vm.jammu.expenses.srt',
            title: 'SRT 70MW Expense',
            tag: 'EXP',
            children: [
              { id: 'vm.jammu.expenses.srt.claims', title: 'Claim Requests', to: '/vendor-management/jammu/expenses/srt-70mw/claim-requests', iconType: 'view-data' },
              { id: 'vm.jammu.expenses.srt.payments', title: 'View Payments', to: '/vendor-management/jammu/expenses/srt-70mw/view-payments', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },
<<<<<<< HEAD
  // {
  //   section: 'VENDOR · KASHMIR',
  //   state: 'kashmir',
  //   items: [
  //     {
  //       id: 'grp.vm.kashmir.inst',
  //       title: 'Installation System',
  //       icon: 'installation',
  //       children: [
  //         {
  //           id: 'grp.vm.kashmir.inst.srt',
  //           title: '70MW Rooftop (SRT)',
  //           tag: 'SRT',
  //           children: [
  //             { id: 'vm.kashmir.inst.view', title: 'Installation Desk', to: '/vendor-management/kashmir/installation', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   section: 'VENDOR · GOA',
  //   state: 'goa',
  //   items: [
  //     {
  //       id: 'grp.vm.goa.inst',
  //       title: 'Installation System',
  //       icon: 'installation',
  //       children: [
  //         {
  //           id: 'grp.vm.goa.inst.srt',
  //           title: 'Solar Rooftop (SRT)',
  //           tag: 'SRT',
  //           children: [
  //             { id: 'vm.goa.inst.view', title: 'Installation Desk', to: '/vendor-management/goa/installation', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },



=======
>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6

  {
    section: 'VENDOR · PUNJAB',
    state: 'punjab',
    items: [
      {
        id: 'grp.vm.punjab.inst',
        title: 'Installation System',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.punjab.inst.ssl',
            title: 'Solar Street Light',
            tag: 'SSL',
            children: [
              { id: 'vm.punjab.ssl.dashboard', title: 'Dashboard', to: '/vendor-management/punjab/ssl/dashboard', iconType: 'analytics' },
              { id: 'vm.punjab.ssl.assign', title: 'Assign Installation', to: '/vendor-management/punjab/ssl/assign-installation', iconType: 'assign' },
              { id: 'vm.punjab.ssl.view-assign', title: 'View Assign Installation', to: '/vendor-management/punjab/ssl/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.punjab.ssl.verify-install', title: 'Verify Installation', to: '/vendor-management/punjab/ssl/verify-installation', iconType: 'view-survey' },
            ],
          },
        ],
      },
    ],
  },

<<<<<<< HEAD

  // {
  //   section: 'VENDOR MANAGEMENT',
  //   items: [
  //     {
  //       id: 'grp.vm.mgmt',
  //       title: 'User Management',
  //       icon: 'management',
  //       children: [
  //         { id: 'vm.users', title: 'Vendor Master & Users', to: '/vendor-management/users', iconType: 'view-data' },
  //       ],
  //     },
  //   ],
  // },
=======
  {
    section: 'VENDOR MANAGEMENT',
    items: [
      {
        id: 'grp.vm.mgmt',
        title: 'User Management',
        icon: 'management',
        children: [
          { id: 'vm.users', title: 'Vendor Master & Users', to: '/vendor-management/users', iconType: 'view-data' },
        ],
      },
    ],
  },

>>>>>>> 5088f43ed9f14038a9aea42e1ee87fc739be08a6
];

function GroupIconBox({ icon }: { icon: 'dashboard' | 'amc' | 'installation' | 'management' | 'attendance' | 'survey' }) {
  switch (icon) {
    case 'dashboard':
      return (
        <div className="vm-sb__icon-box vm-sb__icon-box--dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
      );
    case 'amc':
      return (
        <div className="vm-sb__icon-box vm-sb__icon-box--amc">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      );
    case 'installation':
      return (
        <div className="vm-sb__icon-box vm-sb__icon-box--installation">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      );
    case 'management':
      return (
        <div className="vm-sb__icon-box vm-sb__icon-box--management">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      );
    case 'attendance':
      return (
        <div className="vm-sb__icon-box vm-sb__icon-box--attendance">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
          </svg>
        </div>
      );
    case 'survey':
      return (
        <div className="vm-sb__icon-box vm-sb__icon-box--survey">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        </div>
      );
  }
}

function LeafIcon({ type }: { type?: NavLeaf['iconType'] }) {
  switch (type) {
    case 'assign':
      return (
        <svg className="vm-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'view-assign':
      return (
        <svg className="vm-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    case 'view-survey':
      return (
        <svg className="vm-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'analytics':
      return (
        <svg className="vm-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'view-data':
    default:
      return (
        <svg className="vm-sb__leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

const isLeafAllowed = (to: string) => canAccessSlug(to.replace(/^\//, ''));

const getVisibleSubGroupChildren = (sg: NavSubGroup, filterText: string) => {
  return sg.children.filter((c) => {
    if (!isLeafAllowed(c.to)) return false;
    if (filterText && !c.title.toLowerCase().includes(filterText.toLowerCase())) return false;
    return true;
  });
};

const hasVisibleGroupChildren = (group: NavGroup, filterText: string): boolean => {
  return group.children.some((child) => {
    if ('to' in child) {
      if (!isLeafAllowed(child.to)) return false;
      if (filterText && !child.title.toLowerCase().includes(filterText.toLowerCase())) return false;
      return true;
    }
    return getVisibleSubGroupChildren(child, filterText).length > 0;
  });
};

const checkIsLeafActive = (to: string, currentPath: string): boolean => {
  if (currentPath === to) return true;
  if (
    (to.endsWith('/assign-light') || to.endsWith('/assign-installation')) &&
    (currentPath.endsWith('/assign-light') || currentPath.endsWith('/assign-installation'))
  ) return true;
  if (
    (to.endsWith('/view-assign') || to.endsWith('/view-assign-installation')) &&
    (currentPath.endsWith('/view-assign') || currentPath.endsWith('/view-assign-installation'))
  ) return true;
  if (
    (to.endsWith('/verify') || to.endsWith('/verify-installation')) &&
    (currentPath.endsWith('/verify') || currentPath.endsWith('/verify-installation'))
  ) return true;
  return false;
};

export function VendorManagementSidebar({
  filter = '',
  onNavigate,
}: {
  filter?: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isLeafActive = (to: string) => checkIsLeafActive(to, currentPath);

  return (
    <div className="vm-sidebar">
      {/* ── Top Portal Switcher Card ── */}
      <div className="vm-sb__top-card">
        <div className="vm-sb__portal-info">
          <div className="vm-sb__portal-badge-icon" title="Vendor Management Portal (Super Admin)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="vm-sb__portal-text">
            <span className="vm-sb__portal-title">
              Vendor Portal
              <span className="vm-sb__live-dot" title="Live Vendor Mode" />
            </span>
            <span className="vm-sb__portal-sub">Super Admin Network</span>
          </div>
        </div>

        <Link
          to="/"
          className="vm-sb__back-btn"
          title="Back to Main ERP Dashboard"
          onClick={onNavigate}
        >
          <span className="vm-sb__back-btn-text">← Back to ERP</span>
          <svg className="vm-sb__back-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── Navigation Sections ── */}
      {VENDOR_SECTIONS.map((sec) => {
        // State-based access control: if section belongs to a state
        // and user cannot access that state, hide the entire section!
        if (sec.state && !canAccessState(sec.state)) {
          return null;
        }

        const renderedItems = sec.items
          .map((item) => {
            // 1. Direct Leaf (Dashboard Button with Clean Badge)
            if ('to' in item) {
              if (!isLeafAllowed(item.to)) return null;
              if (filter && !item.title.toLowerCase().includes(filter.toLowerCase())) return null;
              const active = isLeafActive(item.to);
              return (
                <div key={item.id} className="vm-sb__item-wrapper">
                  <Link
                    to={item.to}
                    className={`vm-sb__item-link vm-sb__item-link--dashboard ${active ? 'is-active' : ''}`}
                    onClick={onNavigate}
                    title={item.title}
                    data-tooltip={item.title}
                  >
                    <GroupIconBox icon="dashboard" />
                    <span className="vm-sb__label">{item.title}</span>
                    <span className="vm-sb__badge-pill">Overview</span>
                  </Link>
                </div>
              );
            }

            // 2. Group / Nested
            if (!hasVisibleGroupChildren(item, filter)) {
              return null;
            }

            return (
              <VendorGroupItem
                key={item.id}
                group={item}
                currentPath={currentPath}
                filter={filter}
                onNavigate={onNavigate}
              />
            );
          })
          .filter(Boolean);

        if (!renderedItems.length) return null;

        return (
          <div key={sec.section} className="vm-sb__section-group">
            <div className="vm-sb__section">
              <span className="vm-sb__section-title">{sec.section}</span>
            </div>
            {renderedItems}
          </div>
        );
      })}
    </div>
  );
}

function VendorGroupItem({
  group,
  currentPath,
  filter,
  onNavigate,
}: {
  group: NavGroup;
  currentPath: string;
  filter: string;
  onNavigate?: () => void;
}) {
  if (!hasVisibleGroupChildren(group, filter)) {
    return null;
  }
  const isLeafActive = (to: string) => checkIsLeafActive(to, currentPath);
  const isSubGroupActive = (sg: NavSubGroup) =>
    sg.children.some((c) => isLeafActive(c.to));
  const hasActiveChild = group.children.some((c) =>
    'to' in c ? isLeafActive(c.to) : isSubGroupActive(c)
  );

  const [open, setOpen] = useState(true);
  const isOpen = filter ? true : open;

  return (
    <div className="vm-sb__group">
      <button
        type="button"
        className={`vm-sb__item-btn vm-sb__item-btn--group ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={group.title}
        data-tooltip={group.title}
      >
        <GroupIconBox icon={group.icon} />
        <span className="vm-sb__label">{group.title}</span>
        <svg
          className={`vm-sb__caret ${isOpen ? 'is-open' : ''}`}
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
      <div className="vm-sb__flyout" role="menu" aria-label={group.title}>
        <div className="vm-sb__flyout-header">
          <span className="vm-sb__flyout-title">{group.title}</span>
        </div>
        <div className="vm-sb__flyout-list">
          {group.children.map((child) => {
            if ('to' in child) {
              if (!canAccessSlug(child.to.replace(/^\//, ''))) return null;
              const cActive = isLeafActive(child.to);
              return (
                <Link
                  key={child.id}
                  to={child.to}
                  className={`vm-sb__flyout-link ${cActive ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <LeafIcon type={child.iconType} />
                  <span>{child.title}</span>
                </Link>
              );
            }

            // SubGroup inside flyout
            const subChildren = child.children.filter((sc) =>
              canAccessSlug(sc.to.replace(/^\//, ''))
            );
            if (!subChildren.length) return null;

            return (
              <div key={child.id} className="vm-sb__flyout-subgroup">
                <div className="vm-sb__flyout-subgroup-title">
                  <span>{child.title}</span>
                  {child.tag && <span className="vm-sb__subgroup-tag">{child.tag}</span>}
                </div>
                {subChildren.map((sc) => (
                  <Link
                    key={sc.id}
                    to={sc.to}
                    className={`vm-sb__flyout-link ${isLeafActive(sc.to) ? 'is-active' : ''}`}
                    onClick={onNavigate}
                  >
                    <LeafIcon type={sc.iconType} />
                    <span>{sc.title}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Smooth CSS Grid Accordion Collapse for Expanded/Mobile view */}
      <div className={`vm-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="vm-sb__collapse-inner">
          <div className="vm-sb__children-tree">
            {group.children.map((child) => {
              if ('to' in child) {
                if (!canAccessSlug(child.to.replace(/^\//, ''))) return null;
                if (filter && !child.title.toLowerCase().includes(filter.toLowerCase())) return null;
                const cActive = isLeafActive(child.to);
                return (
                  <Link
                    key={child.id}
                    to={child.to}
                    className={`vm-sb__leaf-link ${cActive ? 'is-active' : ''}`}
                    onClick={onNavigate}
                  >
                    <LeafIcon type={child.iconType} />
                    <span className="vm-sb__label">{child.title}</span>
                  </Link>
                );
              }

              // SubGroup (e.g. SWP, SSL, ULA)
              return (
                <VendorSubGroupItem
                  key={child.id}
                  subGroup={child}
                  currentPath={currentPath}
                  filter={filter}
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorSubGroupItem({
  subGroup,
  currentPath,
  filter,
  onNavigate,
}: {
  subGroup: NavSubGroup;
  currentPath: string;
  filter: string;
  onNavigate?: () => void;
}) {
  const isLeafActive = (to: string) => checkIsLeafActive(to, currentPath);
  const hasActiveChild = subGroup.children.some((c) => isLeafActive(c.to));

  const [open, setOpen] = useState(true);
  const isOpen = filter ? true : open || hasActiveChild;

  const visibleChildren = subGroup.children.filter((c) => {
    if (!canAccessSlug(c.to.replace(/^\//, ''))) return false;
    if (filter && !c.title.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  if (!visibleChildren.length) return null;

  return (
    <div className="vm-sb__subgroup-wrapper">
      <button
        type="button"
        className={`vm-sb__item-btn vm-sb__subgroup-btn ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="vm-sb__label">{subGroup.title}</span>
        {subGroup.tag && <span className="vm-sb__subgroup-tag">{subGroup.tag}</span>}
        <svg
          className={`vm-sb__caret vm-sb__caret-right ${isOpen ? 'is-open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Smooth CSS Grid Accordion Collapse for Subgroup */}
      <div className={`vm-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="vm-sb__collapse-inner">
          <div className="vm-sb__sub-tree">
            {visibleChildren.map((c) => {
              const cActive = isLeafActive(c.to);
              return (
                <Link
                  key={c.id}
                  to={c.to}
                  className={`vm-sb__leaf-link ${cActive ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <LeafIcon type={c.iconType} />
                  <span className="vm-sb__label">{c.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorManagementSidebar;
