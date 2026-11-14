import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { canAccessSlug, canAccessState } from '../../services/stateAccess';
import '../V-Portal/v-portal-sidebar.css';
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
  icon: 'dashboard' | 'amc' | 'installation' | 'management' | 'attendance' | 'material' | 'survey' | 'expense';
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
  {
    section: 'Assam',
    state: 'assam',
    items: [
      {
        id: 'grp.vm.assam.inst',
        title: 'Installation',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.assam.inst.swp',
            title: 'SWP',
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


  // {
  //   section: 'Uttar Pradesh',
  //   state: 'up',
  //   items: [
  //     {
  //       id: 'grp.vm.up.inst',
  //       title: 'Installation',
  //       icon: 'installation',
  //       children: [
  //         {
  //           id: 'grp.vm.up.inst.kusumc',
  //           title: 'Kusum C',
  //           tag: 'Kusum C',
  //           children: [
  //             { id: 'vm.up.inst.kusumc.dashboard', title: 'Dashboard', to: '/vendor-management/up/kusumc/installation/dashboard', iconType: 'analytics' },
  //             { id: 'vm.up.inst.kusumc.assign', title: 'Assign Installation', to: '/vendor-management/up/kusumc/installation/assign', iconType: 'assign' },
  //             { id: 'vm.up.inst.kusumc.view-assign', title: 'View Assign Installation', to: '/vendor-management/up/kusumc/installation/view-assign', iconType: 'view-assign' },
  //             { id: 'vm.up.inst.kusumc.verify-install', title: 'Verify Installation', to: '/vendor-management/up/kusumc/installation/verify', iconType: 'view-survey' },
  //             { id: 'vm.up.inst.kusumc.verify-doc', title: 'Verify Document', to: '/vendor-management/up/kusumc/installation/verify-doc', iconType: 'view-data' },
  //             { id: 'vm.up.inst.kusumc.verify-claim', title: 'Verify Claim', to: '/vendor-management/up/kusumc/installation/verify-claim', iconType: 'view-data' },
  //             { id: 'vm.up.inst.kusumc.view-payment', title: 'View Payment', to: '/vendor-management/up/kusumc/installation/view-payment', iconType: 'view-data' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.inst.resco',
  //           title: 'Resco',
  //           tag: 'RESCO',
  //           children: [
  //             { id: 'vm.up.inst.resco.dashboard', title: 'Dashboard', to: '/vendor-management/up/resco/installation/dashboard', iconType: 'analytics' },
  //             { id: 'vm.up.inst.resco.assign', title: 'Assign Installation', to: '/vendor-management/up/resco/installation/assign', iconType: 'assign' },
  //             { id: 'vm.up.inst.resco.view-assign', title: 'View Assign Installation', to: '/vendor-management/up/resco/installation/view-assign', iconType: 'view-assign' },
  //             { id: 'vm.up.inst.resco.verify-install', title: 'Verify Installation', to: '/vendor-management/up/resco/installation/verify', iconType: 'view-survey' },
  //             { id: 'vm.up.inst.resco.verify-doc', title: 'Verify Document', to: '/vendor-management/up/resco/installation/verify-doc', iconType: 'view-data' },
  //             { id: 'vm.up.inst.resco.view-claim', title: 'View Claim', to: '/vendor-management/up/resco/installation/view-claim', iconType: 'view-data' },
  //             { id: 'vm.up.inst.resco.view-payment', title: 'View Payment', to: '/vendor-management/up/resco/installation/view-payment', iconType: 'view-data' },
  //             { id: 'vm.up.inst.resco.view-create-bill', title: 'View Created Bills', to: '/vendor-management/up/resco/installation/view-create-bill', iconType: 'view-data' },
  //             { id: 'vm.up.inst.resco.view-assign-vendor', title: 'View Assign Vendor Installation', to: '/vendor-management/up/resco/installation/view-assign-vendor', iconType: 'view-assign' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.inst.ssl18w',
  //           title: 'SSL 18W',
  //           tag: 'SSL 18W',
  //           children: [
  //             { id: 'vm.up.inst.ssl18w.dashboard', title: 'Dashboard', to: '/vendor-management/up/ssl18w/installation/dashboard', iconType: 'analytics' },
  //             { id: 'vm.up.inst.ssl18w.assign', title: 'Assign Installation', to: '/vendor-management/up/ssl18w/installation/assign', iconType: 'assign' },
  //             { id: 'vm.up.inst.ssl18w.view-assign', title: 'View Assign Installation', to: '/vendor-management/up/ssl18w/installation/view-assign', iconType: 'view-assign' },
  //             { id: 'vm.up.inst.ssl18w.verify-install', title: 'Verify Installation', to: '/vendor-management/up/ssl18w/installation/verify', iconType: 'view-survey' },
  //             { id: 'vm.up.inst.ssl18w.view-claim', title: 'View Claim', to: '/vendor-management/up/ssl18w/installation/view-claim', iconType: 'view-data' },
  //             { id: 'vm.up.inst.ssl18w.view-payment', title: 'View Payment', to: '/vendor-management/up/ssl18w/installation/view-payment', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //     {
  //       id: 'grp.vm.up.amc',
  //       title: 'AMC',
  //       icon: 'amc',
  //       children: [
  //         {
  //           id: 'grp.vm.up.amc.resco',
  //           title: 'Resco',
  //           tag: 'RESCO',
  //           children: [
  //             { id: 'vm.up.amc.resco.assign-site', title: 'Assign site', to: '/vendor-management/up/resco/amc/assign-site', iconType: 'assign' },
  //             { id: 'vm.up.amc.resco.view-assign-site', title: 'View Assign Site', to: '/vendor-management/up/resco/amc/view-assign-site', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.resco.verify-site', title: 'Verify Site', to: '/vendor-management/up/resco/amc/verify-site', iconType: 'view-survey' },
  //             { id: 'vm.up.amc.resco.claim-request', title: 'Claim Request', to: '/vendor-management/up/resco/amc/claim-request', iconType: 'view-data' },
  //             { id: 'vm.up.amc.resco.view-payment', title: 'Payment', to: '/vendor-management/up/resco/amc/view-payment', iconType: 'view-data' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.ssl',
  //           title: 'Up SSL',
  //           tag: 'SSL',
  //           children: [
  //             { id: 'vm.up.amc.ssl.assign-light', title: 'Assign Lights', to: '/vendor-management/up/ssl/amc/assign-light', iconType: 'assign' },
  //             { id: 'vm.up.amc.ssl.view-assign-light', title: 'View Assign Light', to: '/vendor-management/up/ssl/amc/view-assign-light', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.ssl.verify-assign-light', title: 'Verify Light', to: '/vendor-management/up/ssl/amc/verify-assign-light', iconType: 'view-survey' },
  //             { id: 'vm.up.amc.ssl.claim-request', title: 'Claim Request', to: '/vendor-management/up/ssl/amc/claim-request', iconType: 'view-data' },
  //             { id: 'vm.up.amc.ssl.view-payment', title: 'Payment', to: '/vendor-management/up/ssl/amc/view-payment', iconType: 'view-data' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.ssl18w',
  //           title: 'Up SSL 18w',
  //           tag: 'SSL 18W',
  //           children: [
  //             { id: 'vm.up.amc.ssl18w.assign-light', title: 'Assign Lights', to: '/vendor-management/up/ssl18w/amc/assign-light', iconType: 'assign' },
  //             { id: 'vm.up.amc.ssl18w.view-assign-light', title: 'View Assign Light', to: '/vendor-management/up/ssl18w/amc/view-assign-light', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.ssl18w.verify-assign-light', title: 'Verify Light', to: '/vendor-management/up/ssl18w/amc/verify-assign-light', iconType: 'view-survey' },
  //             { id: 'vm.up.amc.ssl18w.claim-request', title: 'Claim Request', to: '/vendor-management/up/ssl18w/amc/claim-request', iconType: 'view-data' },
  //             { id: 'vm.up.amc.ssl18w.view-payment', title: 'Payment', to: '/vendor-management/up/ssl18w/amc/view-payment', iconType: 'view-data' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.kusumb',
  //           title: 'Kusum B',
  //           tag: 'Kusum B',
  //           children: [
  //             { id: 'vm.up.amc.kusumb.assign-site', title: 'Assign AMC', to: '/vendor-management/up/kusumb/amc/assign-site', iconType: 'assign' },
  //             { id: 'vm.up.amc.kusumb.view-assigne-site', title: 'View AMC', to: '/vendor-management/up/kusumb/amc/view-assign-site', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.kusumb.verify-site', title: 'Verify Amc', to: '/vendor-management/up/kusumb/amc/verify-site', iconType: 'view-survey' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.kusumc',
  //           title: 'Kusum C',
  //           tag: 'Kusum C',
  //           children: [
  //             { id: 'vm.up.amc.kusumc.assign-site', title: 'Assign AMC', to: '/vendor-management/up/kusumc/amc/assign-site', iconType: 'assign' },
  //             { id: 'vm.up.amc.kusumc.view-assign-site', title: 'View Assign AMC', to: '/vendor-management/up/kusumc/amc/view-assign-site', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.kusumc.verify-site', title: 'Verify Site', to: '/vendor-management/up/kusumc/amc/verify-site', iconType: 'view-survey' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.powerpack',
  //           title: 'Power Pack',
  //           tag: 'Power Pack',
  //           children: [
  //             { id: 'vm.up.amc.powerpack.assign-site', title: 'Assign AMC', to: '/vendor-management/up/powerpack/amc/assign-site', iconType: 'assign' },
  //             { id: 'vm.up.amc.powerpack.view-assigne-site', title: 'View Assign AMC', to: '/vendor-management/up/powerpack/amc/view-assign-site', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.powerpack.verify-site', title: 'Verify Site', to: '/vendor-management/up/powerpack/amc/verify-site', iconType: 'view-survey' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.ongrid',
  //           title: 'Ongrid',
  //           tag: 'Ongrid',
  //           children: [
  //             { id: 'vm.up.amc.ongrid.assign-site', title: 'Assign AMC', to: '/vendor-management/up/ongrid/amc/assign-site', iconType: 'assign' },
  //             { id: 'vm.up.amc.ongrid.view-assigne-site', title: 'View Assign AMC', to: '/vendor-management/up/ongrid/amc/view-assign-site', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.ongrid.verify-site', title: 'Verify Site', to: '/vendor-management/up/ongrid/amc/verify-site', iconType: 'view-survey' },
  //           ],
  //         },
  //         {
  //           id: 'grp.vm.up.amc.offgrid',
  //           title: 'Offgrid',
  //           tag: 'Offgrid',
  //           children: [
  //             { id: 'vm.up.amc.offgrid.assign-site', title: 'Assign AMC', to: '/vendor-management/up/offgrid/amc/assign-site', iconType: 'assign' },
  //             { id: 'vm.up.amc.offgrid.view-assigne-site', title: 'View Assign AMC', to: '/vendor-management/up/offgrid/amc/view-assign-site', iconType: 'view-assign' },
  //             { id: 'vm.up.amc.offgrid.verify-site', title: 'Verify Site', to: '/vendor-management/up/offgrid/amc/verify-site', iconType: 'view-survey' },
  //           ],
  //         },
  //       ],
  //     },
  //     {
  //       id: 'grp.vm.up.survey',
  //       title: 'Survey',
  //       icon: 'survey',
  //       children: [
  //         {
  //           id: 'grp.vm.up.survey.resco',
  //           title: 'Resco Survey',
  //           tag: 'RESCO',
  //           children: [
  //             { id: 'vm.up.survey.resco.dashboard', title: 'Resco Dashboard', to: '/vendor-management/up/resco/survey/dashboard', iconType: 'analytics' },
  //             { id: 'vm.up.survey.resco.assign', title: 'Assign Survey', to: '/vendor-management/up/resco/survey/assign', iconType: 'assign' },
  //             { id: 'vm.up.survey.resco.assign-view', title: 'Assign View Survey', to: '/vendor-management/up/resco/survey/assign-view', iconType: 'view-assign' },
  //             { id: 'vm.up.survey.resco.verify', title: 'Verify Survey', to: '/vendor-management/up/resco/survey/verify', iconType: 'view-survey' },
  //             { id: 'vm.up.survey.resco.assign-vendor', title: 'Assigned Sites Update', to: '/vendor-management/up/resco/survey/assign-vendor', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },

  {
    section: 'Kashmir',
    state: 'kashmir',
    items: [
      {
        id: 'grp.vm.kashmir.inst',
        title: 'Installation',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.kashmir.inst.srt70mw',
            title: 'SRT 70MW',
            tag: 'SRT',
            children: [
              { id: 'vm.kashmir.inst.srt70mw.dashboard', title: 'Dashboard', to: '/vendor-management/kashmir/srt70mw/installation/dashboard', iconType: 'analytics' },
              { id: 'vm.kashmir.inst.srt70mw.assign', title: 'Assign Sites', to: '/vendor-management/kashmir/srt70mw/installation/assign', iconType: 'assign' },
              { id: 'vm.kashmir.inst.srt70mw.view-assign', title: 'View Assign Sites', to: '/vendor-management/kashmir/srt70mw/installation/view-assign', iconType: 'view-assign' },
              { id: 'vm.kashmir.inst.srt70mw.verify', title: 'Verify Sites', to: '/vendor-management/kashmir/srt70mw/installation/verify', iconType: 'view-survey' },
              { id: 'vm.kashmir.inst.srt70mw.view-claim', title: 'View Claim', to: '/vendor-management/kashmir/srt70mw/installation/view-claim', iconType: 'view-data' },
              { id: 'vm.kashmir.inst.srt70mw.view-payment', title: 'View Payment', to: '/vendor-management/kashmir/srt70mw/installation/view-payment', iconType: 'view-data' },
            ],
          },
        ],
      },
      {
        id: 'grp.vm.kashmir.expense',
        title: 'Expenses',
        icon: 'expense',
        children: [
          {
            id: 'grp.vm.kashmir.expense.srt70mw',
            title: 'SRT',
            tag: 'SRT',
            children: [
              { id: 'vm.kashmir.expense.srt70mw.claim-requests', title: 'Claim Requests', to: '/vendor-management/kashmir/srt70mw/expense/claim-requests', iconType: 'view-data' },
              { id: 'vm.kashmir.expense.srt70mw.view-payments', title: 'View Payments', to: '/vendor-management/kashmir/srt70mw/expense/view-payments', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },
  // {
  //   section: 'Goa',
  //   state: 'goa',
  //   items: [
  //     {
  //       id: 'grp.vm.goa.survey',
  //       title: 'Survey',
  //       icon: 'survey',
  //       children: [
  //         {
  //           id: 'grp.vm.goa.survey.srt',
  //           title: 'SRT',
  //           tag: 'SRT',
  //           children: [
  //             { id: 'vm.goa.survey.srt.dashboard', title: 'Dashboard', to: '/vendor-management/goa/srt/survey/dashboard', iconType: 'analytics' },
  //             { id: 'vm.goa.survey.srt.assign', title: 'Assign Survey', to: '/vendor-management/goa/srt/survey/assign', iconType: 'assign' },
  //             { id: 'vm.goa.survey.srt.assign-view', title: 'Assign View Survey', to: '/vendor-management/goa/srt/survey/assign-view', iconType: 'view-assign' },
  //             { id: 'vm.goa.survey.srt.verify', title: 'Verify Survey', to: '/vendor-management/goa/srt/survey/verify', iconType: 'view-survey' },
  //           ],
  //         },
  //       ],
  //     },
  //     {
  //       id: 'grp.vm.goa.inst',
  //       title: 'Installation',
  //       icon: 'installation',
  //       children: [
  //         {
  //           id: 'grp.vm.goa.inst.srt',
  //           title: 'SRT',
  //           tag: 'SRT',
  //           children: [
  //             { id: 'vm.goa.inst.srt.dashboard', title: 'Dashboard', to: '/vendor-management/goa/srt/installation/dashboard', iconType: 'analytics' },
  //             { id: 'vm.goa.inst.srt.assign', title: 'Assign Sites', to: '/vendor-management/goa/srt/installation/assign', iconType: 'assign' },
  //             { id: 'vm.goa.inst.srt.view-assign', title: 'View Assign Sites', to: '/vendor-management/goa/srt/installation/view-assign', iconType: 'view-assign' },
  //             { id: 'vm.goa.inst.srt.verify', title: 'Verify Sites', to: '/vendor-management/goa/srt/installation/verify', iconType: 'view-survey' },
  //             { id: 'vm.goa.inst.srt.claim', title: 'View Claim', to: '/vendor-management/goa/srt/installation/claim', iconType: 'view-data' },
  //             { id: 'vm.goa.inst.srt.payment', title: 'View Payment', to: '/vendor-management/goa/srt/installation/payment', iconType: 'view-data' },
  //           ],
  //         },
  //       ],
  //     },
  //     {
  //       id: 'grp.vm.goa.amc',
  //       title: 'AMC',
  //       icon: 'amc',
  //       children: [
  //         {
  //           id: 'grp.vm.goa.amc.srt',
  //           title: 'SRT',
  //           tag: 'SRT',
  //           children: [
  //             { id: 'vm.goa.amc.srt.dashboard', title: 'SRT AMC Dashboard', to: '/vendor-management/goa/srt/amc/dashboard', iconType: 'analytics' },
  //             { id: 'vm.goa.amc.srt.assign', title: 'Assign SRT', to: '/vendor-management/goa/srt/amc/assign', iconType: 'assign' },
  //             { id: 'vm.goa.amc.srt.view-assign', title: 'Assign View Site', to: '/vendor-management/goa/srt/amc/view-assign', iconType: 'view-assign' },
  //             { id: 'vm.goa.amc.srt.verify', title: 'Verify Site', to: '/vendor-management/goa/srt/amc/verify', iconType: 'view-survey' },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
  {
    section: 'Karnataka',
    state: 'karnataka',
    items: [
      {
        id: 'grp.vm.karnataka.inst',
        title: 'Installation',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.karnataka.inst.swp',
            title: 'SWP',
            tag: 'SWP',
            children: [
              { id: 'vm.karnataka.swp.dashboard', title: 'Dashboard', to: '/vendor-management/karnataka/swp/dashboard', iconType: 'analytics' },
              { id: 'vm.karnataka.swp.assign', title: 'Assign Installation', to: '/vendor-management/karnataka/swp/assign-installation', iconType: 'assign' },
              { id: 'vm.karnataka.swp.view-assign', title: 'View Assign Installation', to: '/vendor-management/karnataka/swp/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.karnataka.swp.verify-install', title: 'Verify Installation', to: '/vendor-management/karnataka/swp/verify-installation', iconType: 'view-survey' },
              { id: 'vm.karnataka.swp.verify-doc', title: 'Verify Document', to: '/vendor-management/karnataka/swp/verify-document', iconType: 'view-data' },
              { id: 'vm.karnataka.swp.verify-claim', title: 'Verify Claim', to: '/vendor-management/karnataka/swp/verify-claim', iconType: 'view-data' },
              { id: 'vm.karnataka.swp.view-payment', title: 'View Payment', to: '/vendor-management/karnataka/swp/view-payment', iconType: 'view-data' },
            ],
          },
        ],
      },
      {
        id: 'grp.vm.karnataka.material',
        title: 'Material',
        icon: 'material',
        children: [
          {
            id: 'grp.vm.karnataka.material.swp',
            title: 'SWP',
            tag: 'SWP',
            children: [
              { id: 'vm.karnataka.swp.dispatch-material', title: 'Dispatch Material', to: '/vendor-management/karnataka/swp/material-dispatch', iconType: 'assign' },
              { id: 'vm.karnataka.swp.view-dispatch-material', title: 'View Dispatch Material', to: '/vendor-management/karnataka/swp/view-material-dispatch', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },





    {
    section: 'Bihar',
    state: 'bihar',
    items: [
      {
        id: 'grp.vm.bihar.survey',
        title: 'Survey',
        icon: 'survey',
        children: [
          {
            id: 'grp.vm.bihar.survey.srt200mw',
            title: 'SRT 200MW',
            tag: 'SRT',
            children: [
              { id: 'vm.bihar.survey.srt200mw.dashboard', title: 'Dashboard', to: '/vendor-management/bihar/srt200mw/survey/dashboard', iconType: 'analytics' },
              { id: 'vm.bihar.survey.srt200mw.assign', title: 'Assign Survey', to: '/vendor-management/bihar/srt200mw/survey/assign', iconType: 'assign' },
              { id: 'vm.bihar.survey.srt200mw.assign-view', title: 'Assign View Survey', to: '/vendor-management/bihar/srt200mw/survey/assign-view', iconType: 'view-assign' },
              { id: 'vm.bihar.survey.srt200mw.verify', title: 'Verify Survey', to: '/vendor-management/bihar/srt200mw/survey/verify', iconType: 'view-survey' },
            ],
          },
          {
            id: 'grp.vm.bihar.survey.ula',
            title: 'ULA',
            tag: 'ULA',
            children: [
              { id: 'vm.bihar.survey.ula.view', title: 'View Data', to: '/vendor-management/bihar/ula/survey/view', iconType: 'view-data' },
            ],
          },
        ],
      },
      {
        id: 'grp.vm.bihar.inst',
        title: 'Installation',
        icon: 'installation',
        children: [
          {
            id: 'grp.vm.bihar.inst.ssl',
            title: 'SSL',
            tag: 'SSL',
            children: [
              { id: 'vm.bihar.inst.ssl.dashboard', title: 'Dashboard', to: '/vendor-management/bihar/ssl/installation/dashboard', iconType: 'analytics' },
              { id: 'vm.bihar.inst.ssl.assign', title: 'Assign Light', to: '/vendor-management/bihar/ssl/installation/assign', iconType: 'assign' },
              { id: 'vm.bihar.inst.ssl.view-assign', title: 'View Assign Light', to: '/vendor-management/bihar/ssl/installation/view-assign', iconType: 'view-assign' },
              { id: 'vm.bihar.inst.ssl.verify', title: 'Verify Light', to: '/vendor-management/bihar/ssl/installation/verify', iconType: 'view-survey' },
              { id: 'vm.bihar.inst.ssl.claim-request', title: 'Claim Request', to: '/vendor-management/bihar/ssl/installation/claim-request', iconType: 'view-data' },
              { id: 'vm.bihar.inst.ssl.payment-request', title: 'Payment Request', to: '/vendor-management/bihar/ssl/installation/payment-request', iconType: 'view-data' },
              { id: 'vm.bihar.inst.ssl.supply-inspection', title: 'Supply Inspection Request', to: '/vendor-management/bihar/ssl/installation/supply-inspection', iconType: 'view-data' },
              { id: 'vm.bihar.inst.ssl.installation-inspection', title: 'Installation Inspection Request', to: '/vendor-management/bihar/ssl/installation/installation-inspection', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.bihar.inst.srt',
            title: 'SRT',
            tag: 'SRT',
            children: [
              { id: 'vm.bihar.inst.srt.dashboard', title: 'Dashboard', to: '/vendor-management/bihar/srt/installation/dashboard', iconType: 'analytics' },
              { id: 'vm.bihar.inst.srt.assign', title: 'Assign Sites', to: '/vendor-management/bihar/srt/installation/assign', iconType: 'assign' },
              { id: 'vm.bihar.inst.srt.view-assign', title: 'View Assign Sites', to: '/vendor-management/bihar/srt/installation/view-assign', iconType: 'view-assign' },
              { id: 'vm.bihar.inst.srt.verify', title: 'Verify Sites', to: '/vendor-management/bihar/srt/installation/verify', iconType: 'view-survey' },
              { id: 'vm.bihar.inst.srt.claim', title: 'View Claim', to: '/vendor-management/bihar/srt/installation/claim', iconType: 'view-data' },
              { id: 'vm.bihar.inst.srt.payment', title: 'View Payment', to: '/vendor-management/bihar/srt/installation/payment', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.bihar.inst.ula',
            title: 'ULA',
            tag: 'ULA',
            children: [
              { id: 'vm.bihar.inst.ula.dashboard', title: 'Dashboard', to: '/vendor-management/bihar/ula/installation/dashboard', iconType: 'analytics' },
              { id: 'vm.bihar.inst.ula.assign', title: 'Assign Sites', to: '/vendor-management/bihar/ula/installation/create-assign-site', iconType: 'assign' },
              { id: 'vm.bihar.inst.ula.view-assign', title: 'View Assign Sites', to: '/vendor-management/bihar/ula/installation/view-assign-site', iconType: 'view-assign' },
              { id: 'vm.bihar.inst.ula.structure-approval', title: 'Structure Approval', to: '/vendor-management/bihar/ula/installation/structure-approval-site', iconType: 'view-data' },
              { id: 'vm.bihar.inst.ula.view-site', title: 'Install Site', to: '/vendor-management/bihar/ula/installation/view-site', iconType: 'view-survey' },
              { id: 'vm.bihar.inst.ula.view-doc', title: 'View Document', to: '/vendor-management/bihar/ula/installation/view-document', iconType: 'view-data' },
              { id: 'vm.bihar.inst.ula.view-claim', title: 'View Claim', to: '/vendor-management/bihar/ula/installation/view-claim', iconType: 'view-data' },
              { id: 'vm.bihar.inst.ula.view-payment', title: 'View Payment', to: '/vendor-management/bihar/ula/installation/view-payment', iconType: 'view-data' },
            ],
          },
        ],
      },
      {
        id: 'grp.vm.bihar.amc',
        title: 'AMC',
        icon: 'amc',
        children: [
          {
            id: 'grp.vm.bihar.amc.ssl',
            title: 'SSL',
            tag: 'SSL',
            children: [
              { id: 'vm.bihar.amc.ssl.dashboard', title: 'SSL AMC Dashboard', to: '/vendor-management/bihar/ssl/amc/dashboard', iconType: 'analytics' },
              { id: 'vm.bihar.amc.ssl.assign', title: 'Assign SSL', to: '/vendor-management/bihar/ssl/amc/assign', iconType: 'assign' },
              { id: 'vm.bihar.amc.ssl.verify', title: 'Verify AMC', to: '/vendor-management/bihar/ssl/amc/verify', iconType: 'view-survey' },
            ],
          },
          {
            id: 'grp.vm.bihar.amc.srt',
            title: 'SRT',
            tag: 'SRT',
            children: [
              { id: 'vm.bihar.amc.srt.dashboard', title: 'SRT AMC Dashboard', to: '/vendor-management/bihar/srt/amc/dashboard', iconType: 'analytics' },
              { id: 'vm.bihar.amc.srt.assign', title: 'Assign SRT', to: '/vendor-management/bihar/srt/amc/assign', iconType: 'assign' },
              { id: 'vm.bihar.amc.srt.view-assign', title: 'Assign View Site', to: '/vendor-management/bihar/srt/amc/view-assign', iconType: 'view-assign' },
              { id: 'vm.bihar.amc.srt.verify', title: 'Verify Site', to: '/vendor-management/bihar/srt/amc/verify', iconType: 'view-survey' },
            ],
          },
        ],
      },
    ],
  },





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
              { id: 'vm.arunachal.shl.dashboard', title: 'Dashboard', to: '/vendor-management/arunachal/shl/dashboard', iconType: 'analytics' },
              { id: 'vm.arunachal.shl.assign', title: 'Assign Installation', to: '/vendor-management/arunachal/shl/assign-installation', iconType: 'assign' },
              { id: 'vm.arunachal.shl.view-assign', title: 'View Assign Installation', to: '/vendor-management/arunachal/shl/view-assign-installation', iconType: 'view-assign' },
              { id: 'vm.arunachal.shl.verify-install', title: 'Verify Installation', to: '/vendor-management/arunachal/shl/verify-installation', iconType: 'view-survey' },
             
            ],
          },
        ],
      },
    ],
  },


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
            id: 'grp.vm.jammu.inst.srt',
            title: 'SRT (70MW Rooftop)',
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

  
  {
    section: 'Vendor Management',
    items: [
      {
        id: 'grp.vm.core.ops',
        title: 'Operations',
        icon: 'management',
        children: [
          {
            id: 'grp.vm.core.vendor',
            title: 'Vendor',
            tag: 'Vendor',
            children: [
              { id: 'vm.core.vendor.add', title: 'Add Data', to: '/vendor-management/vendor/add', iconType: 'assign' },
              { id: 'vm.core.vendor.view', title: 'View Data', to: '/vendor-management/vendor/view', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.dle',
            title: 'DLE Users',
            tag: 'DLE',
            children: [
              { id: 'vm.core.dle.view', title: 'View Data', to: '/vendor-management/dle-users', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.workorder',
            title: 'Work Order',
            tag: 'WO',
            children: [
              { id: 'vm.core.workorder.add', title: 'Add Data', to: '/vendor-management/workorder/add', iconType: 'assign' },
              { id: 'vm.core.workorder.view', title: 'View Data', to: '/vendor-management/workorder/view', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.workorder_assign',
            title: 'Work Order Assign',
            tag: 'Assign',
            children: [
              { id: 'vm.core.workorder_assign.add', title: 'Add Data', to: '/vendor-management/workorder-assign/add', iconType: 'assign' },
              { id: 'vm.core.workorder_assign.view', title: 'View Data', to: '/vendor-management/workorder-assign/view', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.rm',
            title: 'Return & Maintanence',
            tag: 'R&M',
            children: [
              { id: 'vm.core.rm.view', title: 'View Data', to: '/vendor-management/rm-request/view', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.payment',
            title: 'Payment',
            tag: 'Pay',
            children: [
              { id: 'vm.core.payment.view', title: 'View Data', to: '/vendor-management/payment/view', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.complaint',
            title: 'Vendor Complaint',
            tag: 'Complaint',
            children: [
              { id: 'vm.core.complaint.view', title: 'View Complaint', to: '/vendor-management/complaint/view', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.report',
            title: 'Vendor Report',
            tag: 'Report',
            children: [
              { id: 'vm.core.report.daily_progress', title: 'View Daily Progress', to: '/vendor-management/report/view-daily-progress', iconType: 'view-data' },
            ],
          },
          {
            id: 'grp.vm.core.users',
            title: 'User Master',
            tag: 'Users',
            children: [
              { id: 'vm.users', title: 'Vendor Master & Users', to: '/vendor-management/users', iconType: 'view-data' },
            ],
          },
        ],
      },
    ],
  },
];

function VPIconBox({ icon }: { icon: string }) {
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
    case 'amc':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--amc">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      );
    case 'expenses':
    case 'expense':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--expenses">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
    case 'reports':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--reports">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
      );
    case 'users':
    case 'management':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--users">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      );
    case 'attendance':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
          </svg>
        </div>
      );
    case 'material':
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--expenses">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="vp-sb__icon-box vp-sb__icon-box--dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      );
  }
}

const ROUTE_ALIASES: Record<string, string[]> = {
  '/vendor-management/karnataka/swp/dashboard': [
    '/karnataka/swp-installation-dashboard',
    '/vendor-management/karnataka/swp-installation-dashboard',
  ],
  '/vendor-management/karnataka/swp/assign-installation': [
    '/karnataka-swp-installation-assign',
    '/vendor-management/karnataka-swp-installation-assign',
  ],
  '/vendor-management/karnataka/swp/view-assign-installation': [
    '/karnataka-view-assign-swp-installation',
    '/vendor-management/karnataka-view-assign-swp-installation',
  ],
  '/vendor-management/karnataka/swp/verify-installation': [
    '/karnataka-verify-swp-installation',
    '/vendor-management/karnataka-verify-swp-installation',
  ],
  '/vendor-management/karnataka/swp/verify-document': [
    '/karnataka-verify-swp-doc',
    '/vendor-management/karnataka-verify-swp-doc',
  ],
  '/vendor-management/karnataka/swp/verify-claim': [
    '/karnataka-view-swp-installation-claim-request',
    '/vendor-management/karnataka-view-swp-installation-claim-request',
  ],
  '/vendor-management/karnataka/swp/view-payment': [
    '/karnataka-view-swp-installation-payment',
    '/vendor-management/karnataka-view-swp-installation-payment',
  ],
  '/vendor-management/karnataka/swp/material-dispatch': [
    '/karnataka/swp-material-dispatch',
    '/vendor-management/karnataka/swp-material-dispatch',
  ],
  '/vendor-management/karnataka/swp/view-material-dispatch': [
    '/karnataka/swp-view-material-dispatch',
    '/vendor-management/karnataka/swp-view-material-dispatch',
  ],

  // ── Uttar Pradesh Installation: Kusum C ──
  '/vendor-management/up/kusumc/installation/dashboard': [
    '/up-dashboard-kusum-c-installation',
    '/vendor-management/up-dashboard-kusum-c-installation',
  ],
  '/vendor-management/up/kusumc/installation/assign': [
    '/up/assign-kusum-c-installation',
    '/vendor-management/up/assign-kusum-c-installation',
  ],
  '/vendor-management/up/kusumc/installation/view-assign': [
    '/up/view-assign-kusum-c-installation',
    '/vendor-management/up/view-assign-kusum-c-installation',
  ],
  '/vendor-management/up/kusumc/installation/verify': [
    '/up/verify-kusum-c-installation',
    '/vendor-management/up/verify-kusum-c-installation',
  ],
  '/vendor-management/up/kusumc/installation/verify-doc': [
    '/up/verify-kusum-c-doc',
    '/vendor-management/up/verify-kusum-c-doc',
  ],
  '/vendor-management/up/kusumc/installation/verify-claim': [
    '/up/view-kusum-c-installation-claim-request',
    '/vendor-management/up/view-kusum-c-installation-claim-request',
  ],
  '/vendor-management/up/kusumc/installation/view-payment': [
    '/up/view-kusum-c-installation-payment',
    '/vendor-management/up/view-kusum-c-installation-payment',
  ],

  // ── Uttar Pradesh Installation: Resco ──
  '/vendor-management/up/resco/installation/dashboard': [
    '/up/resco-installation-dashboard',
    '/vendor-management/up/resco-installation-dashboard',
  ],
  '/vendor-management/up/resco/installation/assign': [
    '/up/resco-installation-assign',
    '/vendor-management/up/resco-installation-assign',
  ],
  '/vendor-management/up/resco/installation/view-assign': [
    '/up/resco-view-assign-installation',
    '/vendor-management/up/resco-view-assign-installation',
  ],
  '/vendor-management/up/resco/installation/verify': [
    '/up/resco-verify-installation',
    '/vendor-management/up/resco-verify-installation',
  ],
  '/vendor-management/up/resco/installation/verify-doc': [
    '/up/resco-verify-doc',
    '/vendor-management/up/resco-verify-doc',
  ],
  '/vendor-management/up/resco/installation/view-claim': [
    '/up/resco-view-installation-claim',
    '/vendor-management/up/resco-view-installation-claim',
  ],
  '/vendor-management/up/resco/installation/view-payment': [
    '/up/resco-view-installation-payment',
    '/vendor-management/up/resco-view-installation-payment',
  ],
  '/vendor-management/up/resco/installation/view-create-bill': [
    '/up/resco-installation-view-create-bill',
    '/vendor-management/up/resco-installation-view-create-bill',
  ],
  '/vendor-management/up/resco/installation/view-assign-vendor': [
    '/up/resco-view-assign-v-installation',
    '/vendor-management/up/resco-view-assign-v-installation',
  ],

  // ── Uttar Pradesh Installation: SSL 18W ──
  '/vendor-management/up/ssl18w/installation/dashboard': [
    '/up/ssl-18w-installation-dashboard',
    '/vendor-management/up/ssl-18w-installation-dashboard',
  ],
  '/vendor-management/up/ssl18w/installation/assign': [
    '/up/ssl-18w-installation-assign',
    '/vendor-management/up/ssl-18w-installation-assign',
  ],
  '/vendor-management/up/ssl18w/installation/view-assign': [
    '/up/ssl-18w-view-assign-installation',
    '/vendor-management/up/ssl-18w-view-assign-installation',
  ],
  '/vendor-management/up/ssl18w/installation/verify': [
    '/up/ssl-18w-installation',
    '/vendor-management/up/ssl-18w-installation',
  ],
  '/vendor-management/up/ssl18w/installation/view-claim': [
    '/up/ssl-18w-installation-claim',
    '/vendor-management/up/ssl-18w-installation-claim',
  ],
  '/vendor-management/up/ssl18w/installation/view-payment': [
    '/up/ssl-18w-installation-payment',
    '/vendor-management/up/ssl-18w-installation-payment',
  ],

  // ── Uttar Pradesh AMC: Resco ──
  '/vendor-management/up/resco/amc/assign-site': ['/up/resco/amc/assign-site'],
  '/vendor-management/up/resco/amc/view-assign-site': ['/up/resco/amc/view-assign-site'],
  '/vendor-management/up/resco/amc/verify-site': ['/up/resco/amc/verify-site'],
  '/vendor-management/up/resco/amc/claim-request': ['/up/resco/amc/claim-request'],
  '/vendor-management/up/resco/amc/view-payment': ['/up/resco/amc/view-payment'],

  // ── Uttar Pradesh AMC: Up SSL ──
  '/vendor-management/up/ssl/amc/assign-light': ['/up/ssl/amc/assign-light'],
  '/vendor-management/up/ssl/amc/view-assign-light': ['/up/ssl/amc/view-assign-light'],
  '/vendor-management/up/ssl/amc/verify-assign-light': ['/up/ssl/amc/verify-assign-light'],
  '/vendor-management/up/ssl/amc/claim-request': ['/up/ssl/amc/claim-request'],
  '/vendor-management/up/ssl/amc/view-payment': ['/up/ssl/amc/view-payment'],

  // ── Uttar Pradesh AMC: Up SSL 18W ──
  '/vendor-management/up/ssl18w/amc/assign-light': ['/up/ssl18w/amc/assign-light'],
  '/vendor-management/up/ssl18w/amc/view-assign-light': ['/up/ssl18w/amc/view-assign-light'],
  '/vendor-management/up/ssl18w/amc/verify-assign-light': ['/up/ssl18w/amc/verify-assign-light'],
  '/vendor-management/up/ssl18w/amc/claim-request': ['/up/ssl18w/amc/claim-request'],
  '/vendor-management/up/ssl18w/amc/view-payment': ['/up/ssl18w/amc/view-payment'],

  // ── Uttar Pradesh AMC: Solar Schemes ──
  '/vendor-management/up/kusumb/amc/assign-site': ['/up/kusumb/amc/assign-site'],
  '/vendor-management/up/kusumb/amc/view-assign-site': ['/up/kusumb/amc/view-assigne-site', '/up/kusumb/amc/view-assign-site'],
  '/vendor-management/up/kusumb/amc/verify-site': ['/up/kusumb/amc/verify-site'],

  '/vendor-management/up/kusumc/amc/assign-site': ['/up/kusumc/amc/assign-site'],
  '/vendor-management/up/kusumc/amc/view-assign-site': ['/up/kusumc/amc/view-assign-site'],
  '/vendor-management/up/kusumc/amc/verify-site': ['/up/kusumc/amc/verify-site'],

  '/vendor-management/up/powerpack/amc/assign-site': ['/up/powerpack/amc/assign-site'],
  '/vendor-management/up/powerpack/amc/view-assign-site': ['/up/powerpack/amc/view-assigne-site', '/up/powerpack/amc/view-assign-site'],
  '/vendor-management/up/powerpack/amc/verify-site': ['/up/powerpack/amc/verify-site'],

  '/vendor-management/up/ongrid/amc/assign-site': ['/up/ongrid/amc/assign-site'],
  '/vendor-management/up/ongrid/amc/view-assign-site': ['/up/ongrid/amc/view-assigne-site', '/up/ongrid/amc/view-assign-site'],
  '/vendor-management/up/ongrid/amc/verify-site': ['/up/ongrid/amc/verify-site'],

  '/vendor-management/up/offgrid/amc/assign-site': ['/up/offgrid/amc/assign-site'],
  '/vendor-management/up/offgrid/amc/view-assign-site': ['/up/offgrid/amc/view-assigne-site', '/up/offgrid/amc/view-assign-site'],
  '/vendor-management/up/offgrid/amc/verify-site': ['/up/offgrid/amc/verify-site'],

  // ── Uttar Pradesh Survey: Resco ──
  '/vendor-management/up/resco/survey/dashboard': [
    '/up/resco-survey-dashboard',
    '/vendor-management/up/resco-survey-dashboard',
  ],
  '/vendor-management/up/resco/survey/assign': [
    '/up/resco-survey-assign',
    '/vendor-management/up/resco-survey-assign',
  ],
  '/vendor-management/up/resco/survey/assign-view': [
    '/up/resco-survey-assign-view',
    '/vendor-management/up/resco-survey-assign-view',
  ],
  '/vendor-management/up/resco/survey/verify': [
    '/up/resco-survey-verify',
    '/vendor-management/up/resco-survey-verify',
  ],
  '/vendor-management/up/resco/survey/assign-vendor': [
    '/up/resco-survey-assign-vendor',
    '/vendor-management/up/resco-survey-assign-vendor',
  ],

  // ── Bihar Survey: SRT 200MW ──
  '/vendor-management/bihar/srt200mw/survey/dashboard': [
    '/bihar/srt200mw-survey-dashbboard',
    '/vendor-management/bihar/srt200mw-survey-dashbboard',
  ],
  '/vendor-management/bihar/srt200mw/survey/assign': [
    '/bihar/srt200mw-survey-assign',
    '/vendor-management/bihar/srt200mw-survey-assign',
  ],
  '/vendor-management/bihar/srt200mw/survey/assign-view': [
    '/bihar/srt200mw-survey-assign-view',
    '/vendor-management/bihar/srt200mw-survey-assign-view',
  ],
  '/vendor-management/bihar/srt200mw/survey/verify': [
    '/bihar/srt200mw-survey-verify',
    '/vendor-management/bihar/srt200mw-survey-verify',
  ],

  // ── Bihar Survey: ULA ──
  '/vendor-management/bihar/ula/survey/view': [
    '/bihar/ula/survey/view',
    '/vendor-management/bihar/ula/survey/view',
  ],

  // ── Bihar Installation: SSL ──
  '/vendor-management/bihar/ssl/installation/dashboard': [
    '/bihar/ssl-installation-dashboard',
    '/vendor-management/bihar/ssl-installation-dashboard',
  ],
  '/vendor-management/bihar/ssl/installation/assign': [
    '/vendor/assign-ssl-sites',
    '/vendor-management/vendor/assign-ssl-sites',
  ],
  '/vendor-management/bihar/ssl/installation/view-assign': [
    '/vendor/view-assign-ssl-sites',
    '/vendor-management/vendor/view-assign-ssl-sites',
  ],
  '/vendor-management/bihar/ssl/installation/verify': [
    '/ssl/view-bihar-all-complete-ssl-site',
    '/vendor-management/ssl/view-bihar-all-complete-ssl-site',
  ],
  '/vendor-management/bihar/ssl/installation/claim-request': [
    '/bihar/ssl-installation-claim-request',
    '/vendor-management/bihar/ssl-installation-claim-request',
  ],
  '/vendor-management/bihar/ssl/installation/payment-request': [
    '/bihar/view-ssl-payment-request',
    '/vendor-management/bihar/view-ssl-payment-request',
  ],
  '/vendor-management/bihar/ssl/installation/supply-inspection': [
    '/bihar/view-ssl-supply-installation-request',
    '/vendor-management/bihar/view-ssl-supply-installation-request',
  ],
  '/vendor-management/bihar/ssl/installation/installation-inspection': [
    '/bihar/view-ssl-installation-inspection-request',
    '/vendor-management/bihar/view-ssl-installation-inspection-request',
  ],

  // ── Bihar Installation: SRT ──
  '/vendor-management/bihar/srt/installation/dashboard': [
    '/bihar/srt-installation-dashboard',
    '/vendor-management/bihar/srt-installation-dashboard',
  ],
  '/vendor-management/bihar/srt/installation/assign': [
    '/srt/assign-srt',
    '/vendor-management/srt/assign-srt',
  ],
  '/vendor-management/bihar/srt/installation/view-assign': [
    '/srt/view',
    '/vendor-management/srt/view',
  ],
  '/vendor-management/bihar/srt/installation/verify': [
    '/srt/verificationsite',
    '/vendor-management/srt/verificationsite',
  ],
  '/vendor-management/bihar/srt/installation/claim': [
    '/srt/claimsite',
    '/vendor-management/srt/claimsite',
  ],
  '/vendor-management/bihar/srt/installation/payment': [
    '/srt/assignsrtpayment',
    '/vendor-management/srt/assignsrtpayment',
  ],

  // ── Bihar Installation: ULA ──
  '/vendor-management/bihar/ula/installation/dashboard': [
    '/bihar/ula/installation/dashboard',
    '/vendor-management/bihar/ula/installation/dashboard',
  ],
  '/vendor-management/bihar/ula/installation/create-assign-site': [
    '/bihar/ula/installation/create-assign-site',
    '/vendor-management/bihar/ula/installation/create-assign-site',
  ],
  '/vendor-management/bihar/ula/installation/view-assign-site': [
    '/bihar/ula/installation/view-assign-site',
    '/vendor-management/bihar/ula/installation/view-assign-site',
  ],
  '/vendor-management/bihar/ula/installation/structure-approval-site': [
    '/bihar/ula/installation/structure-approval-site',
    '/vendor-management/bihar/ula/installation/structure-approval-site',
  ],
  '/vendor-management/bihar/ula/installation/view-site': [
    '/bihar/ula/installation/view-site',
    '/vendor-management/bihar/ula/installation/view-site',
  ],
  '/vendor-management/bihar/ula/installation/view-document': [
    '/bihar/ula/installation/view-document',
    '/vendor-management/bihar/ula/installation/view-document',
  ],
  '/vendor-management/bihar/ula/installation/view-claim': [
    '/bihar/ula/installation/view-claim',
    '/vendor-management/bihar/ula/installation/view-claim',
  ],
  '/vendor-management/bihar/ula/installation/view-payment': [
    '/bihar/ula/installation/view-payment',
    '/vendor-management/bihar/ula/installation/view-payment',
  ],

  // ── Bihar AMC: SSL ──
  '/vendor-management/bihar/ssl/amc/dashboard': [
    '/bihar-ssl-amc-dashboard',
    '/vendor-management/bihar-ssl-amc-dashboard',
  ],
  '/vendor-management/bihar/ssl/amc/assign': [
    '/assign-vendor-biharssl',
    '/vendor-management/assign-vendor-biharssl',
  ],
  '/vendor-management/bihar/ssl/amc/verify': [
    '/bihar-ssl-amc-verify',
    '/vendor-management/bihar-ssl-amc-verify',
  ],

  // ── Bihar AMC: SRT ──
  '/vendor-management/bihar/srt/amc/dashboard': [
    '/bihar/bihar-srt-amc-dashboard',
    '/vendor-management/bihar/bihar-srt-amc-dashboard',
  ],
  '/vendor-management/bihar/srt/amc/assign': [
    '/assign-vendor-srt-bihar',
    '/vendor-management/assign-vendor-srt-bihar',
  ],
  '/vendor-management/bihar/srt/amc/view-assign': [
    '/bihar-srt-amc-assign-site-view',
    '/vendor-management/bihar-srt-amc-assign-site-view',
  ],
  '/vendor-management/bihar/srt/amc/verify': [
    '/bihar-amc-srt-site-verify',
    '/vendor-management/bihar-amc-srt-site-verify',
  ],

  // ── Jammu Survey ──
  '/vendor-management/jammu/srt70mw/survey/verify': [
    '/jammu/srt70mw-survey-verify',
    '/vendor-management/jammu/srt70mw-survey-verify',
  ],
  '/vendor-management/jammu/resco/survey/dashboard': [
    '/jk/resco-survey-dashboard',
    '/vendor-management/jk/resco-survey-dashboard',
  ],
  '/vendor-management/jammu/resco/survey/assign': [
    '/jk/resco-survey-assign',
    '/vendor-management/jk/resco-survey-assign',
  ],
  '/vendor-management/jammu/resco/survey/assign-view': [
    '/jk/resco-survey-assign-view',
    '/vendor-management/jk/resco-survey-assign-view',
  ],
  '/vendor-management/jammu/resco/survey/assign-vendor': [
    '/jk/resco-survey-assign-vendor',
    '/vendor-management/jk/resco-survey-assign-vendor',
  ],
  '/vendor-management/jammu/resco/survey/verify': [
    '/jk/resco-survey-verify',
    '/vendor-management/jk/resco-survey-verify',
  ],

  // ── Jammu Installation: SRT ──
  '/vendor-management/jammu/srt/installation/dashboard': [
    '/jammu/srt70mw-installation-dashboard',
    '/vendor-management/jammu/srt70mw-installation-dashboard',
  ],
  '/vendor-management/jammu/srt/installation/assign': [
    '/jammu/assign-installation-srt70mw',
    '/vendor-management/jammu/assign-installation-srt70mw',
  ],
  '/vendor-management/jammu/srt/installation/view-assign': [
    '/jammu/view-assign-installation-srt70mw',
    '/vendor-management/jammu/view-assign-installation-srt70mw',
  ],
  '/vendor-management/jammu/srt/installation/verify': [
    '/jammu/verify-srt70mw-installation',
    '/vendor-management/jammu/verify-srt70mw-installation',
  ],
  '/vendor-management/jammu/srt/installation/view-claim': [
    '/jammu/view-srt70mw-claim-request',
    '/vendor-management/jammu/view-srt70mw-claim-request',
  ],
  '/vendor-management/jammu/srt/installation/view-payment': [
    '/jammu/view-srt70mw-payment-request',
    '/vendor-management/jammu/view-srt70mw-payment-request',
  ],

  // ── Jammu Installation: SSL ──
  '/vendor-management/jammu/ssl/installation/dashboard': [
    '/jammu/ssl-installation-dashboard',
    '/vendor-management/jammu/ssl-installation-dashboard',
  ],
  '/vendor-management/jammu/ssl/installation/assign': [
    '/jammu/assign-ssl-installation-sites',
    '/vendor-management/jammu/assign-ssl-installation-sites',
  ],
  '/vendor-management/jammu/ssl/installation/view-assign': [
    '/jammu/view-assign-ssl-installation-sites',
    '/vendor-management/jammu/view-assign-ssl-installation-sites',
  ],
  '/vendor-management/jammu/ssl/installation/verify': [
    '/jammu/view-verify-ssl-installation',
    '/vendor-management/jammu/view-verify-ssl-installation',
  ],
  '/vendor-management/jammu/ssl/installation/claim-request': [
    '/jammu/view-ssl-installation-claim-request',
    '/vendor-management/jammu/view-ssl-installation-claim-request',
  ],
  '/vendor-management/jammu/ssl/installation/payment-request': [
    '/jammu/view-ssl-installation-payment-request',
    '/vendor-management/jammu/view-ssl-installation-payment-request',
  ],

  // ── Jammu Installation: SWP ──
  '/vendor-management/jammu/swp/installation/dashboard': [
    '/jammu/swp-installation-dashboard',
    '/vendor-management/jammu/swp-installation-dashboard',
  ],
  '/vendor-management/jammu/swp/installation/assign': [
    '/jammu-swp-installation-assign',
    '/vendor-management/jammu-swp-installation-assign',
  ],
  '/vendor-management/jammu/swp/installation/view-assign': [
    '/jammu-view-assign-swp-installation',
    '/vendor-management/jammu-view-assign-swp-installation',
  ],
  '/vendor-management/jammu/swp/installation/verify': [
    '/jammu-verify-swp-installation',
    '/vendor-management/jammu-verify-swp-installation',
  ],
  '/vendor-management/jammu/swp/installation/verify-doc': [
    '/jammu-verify-swp-doc',
    '/vendor-management/jammu-verify-swp-doc',
  ],
  '/vendor-management/jammu/swp/installation/verify-claim': [
    '/jammu-view-swp-installation-claim-request',
    '/vendor-management/jammu-view-swp-installation-claim-request',
  ],
  '/vendor-management/jammu/swp/installation/view-payment': [
    '/jammu-view-swp-installation-payment',
    '/vendor-management/jammu-view-swp-installation-payment',
  ],

  // ── Jammu Installation: Resco ──
  '/vendor-management/jammu/resco/installation/dashboard': [
    '/jammu/resco-installation-dashboard',
    '/vendor-management/jammu/resco-installation-dashboard',
  ],
  '/vendor-management/jammu/resco/installation/assign': [
    '/jammu/resco-installation-assign',
    '/vendor-management/jammu/resco-installation-assign',
  ],
  '/vendor-management/jammu/resco/installation/view-assign': [
    '/jammu/resco-view-assign-installation',
    '/vendor-management/jammu/resco-view-assign-installation',
  ],
  '/vendor-management/jammu/resco/installation/view-assign-vendor': [
    '/jammu/resco-view-assign-v-installation',
    '/vendor-management/jammu/resco-view-assign-v-installation',
  ],
  '/vendor-management/jammu/resco/installation/verify': [
    '/jammu/resco-verify-installation',
    '/vendor-management/jammu/resco-verify-installation',
  ],
  '/vendor-management/jammu/resco/installation/verify-doc': [
    '/jammu/resco-verify-doc',
    '/vendor-management/jammu/resco-verify-doc',
  ],
  '/vendor-management/jammu/resco/installation/view-claim': [
    '/jammu/resco-view-installation-claim',
    '/vendor-management/jammu/resco-view-installation-claim',
  ],
  '/vendor-management/jammu/resco/installation/view-payment': [
    '/jammu/resco-view-installation-payment',
    '/vendor-management/jammu/resco-view-installation-payment',
  ],
  '/vendor-management/jammu/resco/installation/view-create-bill': [
    '/jammu/resco-installation-view-create-bill',
    '/vendor-management/jammu/resco-installation-view-create-bill',
  ],

  // ── Jammu Expense: SRT 70MW ──
  '/vendor-management/jammu/srt/expense/claim-requests': [
    '/jammu/srt-installation-claim-expense',
    '/vendor-management/jammu/srt-installation-claim-expense',
  ],
  '/vendor-management/jammu/srt/expense/view-payments': [
    '/jammu/srt-installation-view-payment-expense',
    '/vendor-management/jammu/srt-installation-view-payment-expense',
  ],

  // ── Kashmir Installation: SRT 70MW ──
  '/vendor-management/kashmir/srt70mw/installation/dashboard': [
    '/kashmir/srt70mw/installation-dashboard',
    '/vendor-management/kashmir/srt70mw/installation-dashboard',
  ],
  '/vendor-management/kashmir/srt70mw/installation/assign': [
    '/kashmir/assign-installation-srt70mw',
    '/vendor-management/kashmir/assign-installation-srt70mw',
  ],
  '/vendor-management/kashmir/srt70mw/installation/view-assign': [
    '/kashmir/view-assign-installation-srt70mw',
    '/vendor-management/kashmir/view-assign-installation-srt70mw',
  ],
  '/vendor-management/kashmir/srt70mw/installation/verify': [
    '/kashmir/verify-srt70mw-installation',
    '/vendor-management/kashmir/verify-srt70mw-installation',
  ],
  '/vendor-management/kashmir/srt70mw/installation/view-claim': [
    '/kashmir/view-srt70mw-claim-request',
    '/vendor-management/kashmir/view-srt70mw-claim-request',
  ],
  '/vendor-management/kashmir/srt70mw/installation/view-payment': [
    '/kashmir/view-srt70mw-payment-request',
    '/vendor-management/kashmir/view-srt70mw-payment-request',
  ],

  // ── Kashmir Expense: SRT 70MW ──
  '/vendor-management/kashmir/srt70mw/expense/claim-requests': [
    '/kashmir/srt-installation-claim-expense',
    '/vendor-management/kashmir/srt-installation-claim-expense',
  ],
  '/vendor-management/kashmir/srt70mw/expense/view-payments': [
    '/kashmir/srt-installation-view-payment-expense',
    '/vendor-management/kashmir/srt-installation-view-payment-expense',
  ],

  // ── Goa Survey: SRT ──
  '/vendor-management/goa/srt/survey/dashboard': [
    '/goa/srt/survey-dashbboard',
    '/vendor-management/goa/srt/survey-dashbboard',
  ],
  '/vendor-management/goa/srt/survey/assign': [
    '/goa/srt/survey-assign',
    '/vendor-management/goa/srt/survey-assign',
  ],
  '/vendor-management/goa/srt/survey/assign-view': [
    '/goa/srt/survey-assign-view',
    '/vendor-management/goa/srt/survey-assign-view',
  ],
  '/vendor-management/goa/srt/survey/verify': [
    '/goa/srt/survey-verify',
    '/vendor-management/goa/srt/survey-verify',
  ],

  // ── Goa Installation: SRT ──
  '/vendor-management/goa/srt/installation/dashboard': [
    '/goa/srt-installation-dashboard',
    '/vendor-management/goa/srt-installation-dashboard',
  ],
  '/vendor-management/goa/srt/installation/assign': [
    '/goa/srt/assign-srt',
    '/vendor-management/goa/srt/assign-srt',
  ],
  '/vendor-management/goa/srt/installation/view-assign': [
    '/goa/srt/view',
    '/vendor-management/goa/srt/view',
  ],
  '/vendor-management/goa/srt/installation/verify': [
    '/goa/srt/verificationsite',
    '/vendor-management/goa/srt/verificationsite',
  ],
  '/vendor-management/goa/srt/installation/claim': [
    '/goa/srt/claimsite',
    '/vendor-management/goa/srt/claimsite',
  ],
  '/vendor-management/goa/srt/installation/payment': [
    '/goa/srt/assignsrtpayment',
    '/vendor-management/goa/srt/assignsrtpayment',
  ],

  // ── Goa AMC: SRT ──
  '/vendor-management/goa/srt/amc/dashboard': [
    '/goa/goa-srt-amc-dashboard',
    '/vendor-management/goa/goa-srt-amc-dashboard',
  ],
  '/vendor-management/goa/srt/amc/assign': [
    '/assign-vendor-srt-goa',
    '/vendor-management/assign-vendor-srt-goa',
  ],
  '/vendor-management/goa/srt/amc/view-assign': [
    '/goa-srt-amc-assign-site-view',
    '/vendor-management/goa-srt-amc-assign-site-view',
  ],
  '/vendor-management/goa/srt/amc/verify': [
    '/goa-amc-srt-site-verify',
    '/vendor-management/goa-amc-srt-site-verify',
  ],

  // ── Punjab Installation: SSL ──
  '/vendor-management/punjab/ssl/installation/dashboard': [
    '/punjab/ssl/installation/dashboard',
  ],
  '/vendor-management/punjab/ssl/installation/assign-lights': [
    '/punjab/ssl/installation/assign-lights',
  ],
  '/vendor-management/punjab/ssl/installation/view-assign-lights': [
    '/punjab/ssl/installation/view-assign-lights',
  ],
  '/vendor-management/punjab/ssl/installation/verify-lights': [
    '/punjab/ssl/installation/verify-lights',
  ],

  // ── Vendor Operations ──
  '/vendor-management/vendor/add': ['/add-vendor'],
  '/vendor-management/vendor/view': ['/view-vendor'],
  '/vendor-management/dle-users': ['/dle/users'],
  '/vendor-management/workorder/add': ['/vendor/add-workorder'],
  '/vendor-management/workorder/view': ['/vendor/view-workorder'],
  '/vendor-management/workorder-assign/add': ['/vendor/add-workorder-assign'],
  '/vendor-management/workorder-assign/view': ['/vendor/view-workorder-assign'],
  '/vendor-management/rm-request/view': ['/vendor/view-rm-request'],
  '/vendor-management/payment/view': ['/view-payment'],
  '/vendor-management/complaint/view': ['/view-vendor-complaint'],
  '/vendor-management/report/view-daily-progress': ['/view-daily-progress'],
};

const checkLeafActive = (to: string, currentPath: string): boolean => {
  if (currentPath === to) return true;
  const aliases = ROUTE_ALIASES[to];
  return !!aliases && aliases.includes(currentPath);
};

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

export function VendorManagementSidebar({
  filter = '',
  onNavigate,
}: {
  filter?: string;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isLeafActive = (to: string) => checkLeafActive(to, currentPath);

  const isDashboardActive =
    currentPath === '/vendor-management' ||
    currentPath === '/vendor/dashboard' ||
    currentPath === '/vendor';

  return (
    <div className="vp-sidebar">
      {/* ── Primary Vendor Dashboard Link (Identical to V-Portal) ── */}
      <div className="vp-sb__item-wrapper" style={{ marginBottom: 10 }}>
        <Link
          to="/vendor-management"
          className={`vp-sb__item-link vp-sb__item-link--dashboard ${isDashboardActive ? 'is-active' : ''}`}
          onClick={onNavigate}
          title="Vendor Dashboard"
          data-tooltip="Vendor Dashboard"
        >
          <VPIconBox icon="dashboard" />
          <span className="vp-sb__label">Vendor Dashboard</span>
          <span className="vp-sb__badge-pill">Overview</span>
        </Link>
      </div>

      {/* ── Navigation Sections ── */}
      {VENDOR_SECTIONS.map((sec) => {
        if (sec.section === 'VENDOR DASHBOARD' || sec.section === 'Vendor Dashboard') {
          return null;
        }
        // State-based access control: if section belongs to a state
        // and user cannot access that state, hide the entire section!
        if (sec.state && !canAccessState(sec.state)) {
          return null;
        }

        const renderedItems = sec.items
          .map((item) => {
            // 1. Direct Leaf (Overview Link)
            if ('to' in item) {
              if (!isLeafAllowed(item.to)) return null;
              if (filter && !item.title.toLowerCase().includes(filter.toLowerCase())) return null;
              const active = isLeafActive(item.to);
              return (
                <div key={item.id} className="vp-sb__item-wrapper" style={{ marginBottom: 4 }}>
                  <Link
                    to={item.to}
                    className={`vp-sb__item-link vp-sb__item-link--dashboard ${active ? 'is-active' : ''}`}
                    onClick={onNavigate}
                    title={item.title}
                    data-tooltip={item.title}
                  >
                    <VPIconBox icon="dashboard" />
                    <span className="vp-sb__label">{item.title}</span>
                    <span className="vp-sb__badge-pill">Overview</span>
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
          <div key={sec.section} className="vp-sb__section-group">
            <div className="vp-sb__section">
              <span className="vp-sb__section-title">{sec.section}</span>
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
  const isLeafActive = (to: string) => checkLeafActive(to, currentPath);
  const isSubGroupActive = (sg: NavSubGroup) =>
    sg.children.some((c) => isLeafActive(c.to));
  const hasActiveChild = group.children.some((c) =>
    'to' in c ? isLeafActive(c.to) : isSubGroupActive(c)
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
        title={group.title}
        data-tooltip={group.title}
      >
        <VPIconBox icon={group.icon} />
        <span className="vp-sb__label">{group.title}</span>
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
      <div className="vp-sb__flyout" role="menu" aria-label={group.title}>
        <div className="vp-sb__flyout-header">
          <span className="vp-sb__flyout-title">{group.title}</span>
        </div>
        <div className="vp-sb__flyout-list">
          {group.children.map((child) => {
            if ('to' in child) {
              if (!canAccessSlug(child.to.replace(/^\//, ''))) return null;
              const cActive = isLeafActive(child.to);
              return (
                <Link
                  key={child.id}
                  to={child.to}
                  className={`vp-sb__flyout-link ${cActive ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <svg className="vp-sb__leaf-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
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
              <div key={child.id} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-text-muted)', padding: '2px 8px' }}>
                  {child.title}
                </div>
                {subChildren.map((sc) => (
                  <Link
                    key={sc.id}
                    to={sc.to}
                    className={`vp-sb__flyout-link ${isLeafActive(sc.to) ? 'is-active' : ''}`}
                    onClick={onNavigate}
                  >
                    <svg className="vp-sb__leaf-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="6" />
                    </svg>
                    <span>{sc.title}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Smooth CSS Grid Accordion Collapse for Expanded/Mobile view */}
      <div className={`vp-sb__collapse-wrapper ${isOpen ? 'is-open' : ''}`}>
        <div className="vp-sb__collapse-inner">
          <div className="vp-sb__children-tree">
            {group.children.map((child) => {
              if ('to' in child) {
                if (!canAccessSlug(child.to.replace(/^\//, ''))) return null;
                if (filter && !child.title.toLowerCase().includes(filter.toLowerCase())) return null;
                const cActive = isLeafActive(child.to);
                return (
                  <Link
                    key={child.id}
                    to={child.to}
                    className={`vp-sb__leaf-link ${cActive ? 'is-active' : ''}`}
                    onClick={onNavigate}
                  >
                    <svg className="vp-sb__leaf-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="6" />
                    </svg>
                    <span className="vp-sb__label">{child.title}</span>
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
  const isLeafActive = (to: string) => checkLeafActive(to, currentPath);
  const hasActiveChild = subGroup.children.some((c) => isLeafActive(c.to));

  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild]);

  const isOpen = filter ? true : open;

  const visibleChildren = subGroup.children.filter((c) => {
    if (!canAccessSlug(c.to.replace(/^\//, ''))) return false;
    if (filter && !c.title.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  if (!visibleChildren.length) return null;

  return (
    <div className="vp-sb__subgroup-block" style={{ marginBottom: 4 }}>
      <button
        type="button"
        className={`vp-sb__sub-btn ${hasActiveChild ? 'is-trail' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={subGroup.title}
      >
        {/* Bullseye / target icon matching V-Portal */}
        <svg className="vp-sb__sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
        </svg>
        <span className="vp-sb__label" style={{ fontWeight: 600 }}>{subGroup.title}</span>
        {subGroup.tag && (
          <span
            style={{
              padding: '1px 5px',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 4,
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid rgba(37, 99, 235, 0.15)',
              marginRight: 4,
              flexShrink: 0,
            }}
          >
            {subGroup.tag}
          </span>
        )}
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
            {visibleChildren.map((c) => {
              const cActive = isLeafActive(c.to);
              return (
                <Link
                  key={c.id}
                  to={c.to}
                  className={`vp-sb__leaf-link ${cActive ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <svg className="vp-sb__leaf-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <span className="vp-sb__label">{c.title}</span>
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
