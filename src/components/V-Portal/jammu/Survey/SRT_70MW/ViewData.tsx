import { useState, useMemo, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  Pagination,
  usePagination,
  SearchInput,
} from '../../../../../common';

export interface JammuSurveyRecord {
  srNo: number;
  uniqueId: string;
  state: string;
  district: string;
  department: string;
  siteName: string;
  siteAddress: string;
  caNo: string;
  surveyAddress: string;
  nearestLandmark: string;
  contactPerson: string;
  contactNo: string;
  proposedCapacityKw: number;
  latitude: string;
  longitude: string;
  loadType: string;
  connectionPhase: string;
  meterConnectionType: string;
  meterNumber: string;
  sanctionLoadKw: string;
  instantaneousLoadKw: string;
  gridAvailability: string;
  isAllThreePhaseInLtdb: string;
  missingPhase: string;
  ltdbPresent: string;
  isExistingDgSet: string;
  dgSetCapacity: string;
  dgSetMake: string;
  roofCondition: string;
  totalRoofAreaSqFt: number;
  freeSpaceSolarSqFt: number;
  freeSpaceControlRoomSqFt: number;
  earthPitPosition: string;
  routingAcCableMtr: number;
  typeOfRoof: string;
  typeOfStructureRequired: string;
  ageOfBuilding: string;
  accessToRoof: string;
  rooftopHeightMtr: number;
  parapetHeightMtr: number;
  noOfFloors: string;
  accessToSite: string;
  distanceFromMainRoadKm: number;
  buildingImage: string;
  roofImage: string;
  controlRoomImage: string;
  otherImage: string;
  pdfUrl: string;
}

// Sample realistic survey records across Jammu districts
const INITIAL_SURVEY_DATA: JammuSurveyRecord[] = [
  {
    srNo: 1,
    uniqueId: 'JK-JMU-SRT-001',
    state: 'Jammu & Kashmir',
    district: 'Jammu',
    department: 'JAKEDA (J&K Energy Development Agency)',
    siteName: 'Government Polytechnic College Jammu',
    siteAddress: 'Bikram Chowk, Jammu, J&K - 180004',
    caNo: 'CA-JMU-889102',
    surveyAddress: 'Main Administrative & Workshop Block, Bikram Chowk',
    nearestLandmark: 'Opposite Asia Hotel / Bikram Chowk Flyover',
    contactPerson: 'Er. Rakesh Sharma (Principal)',
    contactNo: '+91 94191 23456',
    proposedCapacityKw: 50,
    latitude: '32.7184° N',
    longitude: '74.8625° E',
    loadType: 'Commercial / Institutional',
    connectionPhase: '3 Phase',
    meterConnectionType: 'LT-CT Metered',
    meterNumber: 'MTR-JMU-44019',
    sanctionLoadKw: '65 KW',
    instantaneousLoadKw: '42.5 KW',
    gridAvailability: '22 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '62.5 KVA',
    dgSetMake: 'Kirloskar',
    roofCondition: 'Good (RCC Flat)',
    totalRoofAreaSqFt: 8500,
    freeSpaceSolarSqFt: 5200,
    freeSpaceControlRoomSqFt: 180,
    earthPitPosition: 'North-East Corner Garden Area',
    routingAcCableMtr: 35,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Elevated HDG Ballasted Frame (1.5m clearance)',
    ageOfBuilding: '12 Years',
    accessToRoof: 'Permanent Concrete Staircase',
    rooftopHeightMtr: 11.5,
    parapetHeightMtr: 1.2,
    noOfFloors: 'G + 2',
    accessToSite: 'Wide Double Lane Paved Road',
    distanceFromMainRoadKm: 0.1,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.png',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 2,
    uniqueId: 'JK-JMU-SRT-002',
    state: 'Jammu & Kashmir',
    district: 'Jammu',
    department: 'Health & Medical Education Department',
    siteName: 'Sub-District Hospital Gandhinagar',
    siteAddress: 'Hospital Road, Gole Market, Gandhi Nagar, Jammu - 180004',
    caNo: 'CA-JMU-554210',
    surveyAddress: 'Hospital Main Complex, Block-B Rooftop',
    nearestLandmark: 'Near Gole Market Gurudwara',
    contactPerson: 'Dr. Anita Choudhary (Medical Superintendent)',
    contactNo: '+91 94191 87654',
    proposedCapacityKw: 75,
    latitude: '32.7042° N',
    longitude: '74.8711° E',
    loadType: 'Continuous Critical Hospital Load',
    connectionPhase: '3 Phase',
    meterConnectionType: 'HT Substation Metered',
    meterNumber: 'MTR-JMU-99823',
    sanctionLoadKw: '110 KW',
    instantaneousLoadKw: '68 KW',
    gridAvailability: '23.5 Hours / Day (Express Feeder)',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '125 KVA',
    dgSetMake: 'Cummins India',
    roofCondition: 'Excellent (Waterproofed RCC)',
    totalRoofAreaSqFt: 12000,
    freeSpaceSolarSqFt: 7800,
    freeSpaceControlRoomSqFt: 220,
    earthPitPosition: 'Substation Yard South Boundary',
    routingAcCableMtr: 42,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Standard Elevated HDG Structure',
    ageOfBuilding: '8 Years',
    accessToRoof: 'Staircase with Fire Door Access',
    rooftopHeightMtr: 14.0,
    parapetHeightMtr: 1.5,
    noOfFloors: 'G + 3',
    accessToSite: 'Heavy Vehicle Accessible Road',
    distanceFromMainRoadKm: 0.05,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.jpg',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 3,
    uniqueId: 'JK-SAM-SRT-003',
    state: 'Jammu & Kashmir',
    district: 'Samba',
    department: 'Higher Education Department J&K',
    siteName: 'Govt. Degree College Samba',
    siteAddress: 'NH-44 National Highway, Samba, J&K - 184121',
    caNo: 'CA-SAM-331209',
    surveyAddress: 'Science & Arts Academic Block',
    nearestLandmark: 'Near Samba Bus Stand on Highway',
    contactPerson: 'Prof. Surinder Verma',
    contactNo: '+91 97970 11223',
    proposedCapacityKw: 40,
    latitude: '32.5584° N',
    longitude: '75.1189° E',
    loadType: 'Educational Institution',
    connectionPhase: '3 Phase',
    meterConnectionType: 'LT-CT Metered',
    meterNumber: 'MTR-SAM-11204',
    sanctionLoadKw: '50 KW',
    instantaneousLoadKw: '31.2 KW',
    gridAvailability: '20 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '45 KVA',
    dgSetMake: 'Mahindra Powerol',
    roofCondition: 'Good (RCC Surface)',
    totalRoofAreaSqFt: 7200,
    freeSpaceSolarSqFt: 4600,
    freeSpaceControlRoomSqFt: 150,
    earthPitPosition: 'Open Ground Lawn Behind Lab Block',
    routingAcCableMtr: 28,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Ground & Roof Dual Tilt HDG',
    ageOfBuilding: '15 Years',
    accessToRoof: 'Standard Staircase',
    rooftopHeightMtr: 9.2,
    parapetHeightMtr: 1.0,
    noOfFloors: 'G + 1',
    accessToSite: 'Direct NH-44 Service Lane',
    distanceFromMainRoadKm: 0.02,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.png',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 4,
    uniqueId: 'JK-KAT-SRT-004',
    state: 'Jammu & Kashmir',
    district: 'Kathua',
    department: 'JPDCL (Jammu Power Distribution Corp Ltd)',
    siteName: 'Sub-Divisional Office JPDCL Kathua',
    siteAddress: 'Govind Nagar, Kathua, J&K - 184101',
    caNo: 'CA-KAT-991204',
    surveyAddress: 'Administrative Building Rooftop',
    nearestLandmark: 'Adjacent to Kathua Sub-station',
    contactPerson: 'Er. Sandeep Kotwal (AEE)',
    contactNo: '+91 94192 33445',
    proposedCapacityKw: 25,
    latitude: '32.3716° N',
    longitude: '75.5192° E',
    loadType: 'Commercial Office',
    connectionPhase: '3 Phase',
    meterConnectionType: 'Direct Bidirectional',
    meterNumber: 'MTR-KAT-88401',
    sanctionLoadKw: '35 KW',
    instantaneousLoadKw: '19.8 KW',
    gridAvailability: '23 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'No',
    dgSetCapacity: 'N/A',
    dgSetMake: 'N/A',
    roofCondition: 'Good (Waterproofed Sheet Overlay)',
    totalRoofAreaSqFt: 4500,
    freeSpaceSolarSqFt: 3100,
    freeSpaceControlRoomSqFt: 120,
    earthPitPosition: 'Compound Wall Border East',
    routingAcCableMtr: 18,
    typeOfRoof: 'RCC Flat + Metal Shed Portion',
    typeOfStructureRequired: 'Trapezoidal Metal Sheet Clamp & HDG',
    ageOfBuilding: '10 Years',
    accessToRoof: 'Steel Cage Ladder',
    rooftopHeightMtr: 7.5,
    parapetHeightMtr: 0.9,
    noOfFloors: 'G + 1',
    accessToSite: 'Sub-divisional Compound Paved Road',
    distanceFromMainRoadKm: 0.2,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.jpg',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 5,
    uniqueId: 'JK-UDH-SRT-005',
    state: 'Jammu & Kashmir',
    district: 'Udhampur',
    department: 'School Education Department J&K',
    siteName: 'Govt. Higher Secondary School Boys Udhampur',
    siteAddress: 'Court Road, Udhampur, J&K - 182101',
    caNo: 'CA-UDH-771239',
    surveyAddress: 'Library & Auditorium Block Rooftop',
    nearestLandmark: 'Near District Court Complex',
    contactPerson: 'Sh. Pawan Dogra (Principal)',
    contactNo: '+91 96220 55667',
    proposedCapacityKw: 30,
    latitude: '32.9248° N',
    longitude: '75.1432° E',
    loadType: 'School / Institutional',
    connectionPhase: '3 Phase',
    meterConnectionType: 'LT-CT Metered',
    meterNumber: 'MTR-UDH-66521',
    sanctionLoadKw: '40 KW',
    instantaneousLoadKw: '22.0 KW',
    gridAvailability: '19.5 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '30 KVA',
    dgSetMake: 'Ashok Leyland',
    roofCondition: 'Satisfactory (RCC Clean Surface)',
    totalRoofAreaSqFt: 5800,
    freeSpaceSolarSqFt: 3800,
    freeSpaceControlRoomSqFt: 140,
    earthPitPosition: 'Behind Chemistry Lab Compound',
    routingAcCableMtr: 32,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Elevated HDG Structure (1.8m height)',
    ageOfBuilding: '18 Years',
    accessToRoof: 'Internal Concrete Staircase',
    rooftopHeightMtr: 8.8,
    parapetHeightMtr: 1.1,
    noOfFloors: 'G + 1',
    accessToSite: 'Wide School Entry Gate',
    distanceFromMainRoadKm: 0.15,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.png',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 6,
    uniqueId: 'JK-RAJ-SRT-006',
    state: 'Jammu & Kashmir',
    district: 'Rajouri',
    department: 'PWD (R&B) Jammu',
    siteName: 'PWD Executive Engineer Complex Rajouri',
    siteAddress: 'Dak Bungalow Road, Rajouri, J&K - 185131',
    caNo: 'CA-RAJ-441098',
    surveyAddress: 'Design & Drawing Wing Rooftop',
    nearestLandmark: 'Adjacent to Rajouri Dak Bungalow',
    contactPerson: 'Er. Mohd. Farooq (Executive Engineer)',
    contactNo: '+91 94193 77889',
    proposedCapacityKw: 20,
    latitude: '33.3791° N',
    longitude: '74.3129° E',
    loadType: 'Government Administrative Office',
    connectionPhase: '3 Phase',
    meterConnectionType: 'Smart Bidirectional Net-Meter',
    meterNumber: 'MTR-RAJ-33104',
    sanctionLoadKw: '30 KW',
    instantaneousLoadKw: '16.4 KW',
    gridAvailability: '18 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '25 KVA',
    dgSetMake: 'Escorts',
    roofCondition: 'Good (RCC Slab)',
    totalRoofAreaSqFt: 4100,
    freeSpaceSolarSqFt: 2600,
    freeSpaceControlRoomSqFt: 110,
    earthPitPosition: 'Compound Garden Lawn Area',
    routingAcCableMtr: 24,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Hot-Dip Galvanized Mounting (120 Micron)',
    ageOfBuilding: '14 Years',
    accessToRoof: 'Concrete Stairway',
    rooftopHeightMtr: 8.0,
    parapetHeightMtr: 1.0,
    noOfFloors: 'G + 1',
    accessToSite: 'Metal Road with Tar Surface',
    distanceFromMainRoadKm: 0.3,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.jpg',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 7,
    uniqueId: 'JK-REA-SRT-007',
    state: 'Jammu & Kashmir',
    district: 'Reasi',
    department: 'JAKEDA (J&K Energy Development Agency)',
    siteName: 'District Administrative Complex Reasi (DC Office)',
    siteAddress: 'Mini Secretariat, Reasi, J&K - 182311',
    caNo: 'CA-REA-110293',
    surveyAddress: 'Block-A & B Secretariat Rooftop',
    nearestLandmark: 'Main DC Office Chowk',
    contactPerson: 'Sh. Tariq Ahmed (Planning Officer)',
    contactNo: '+91 94191 66554',
    proposedCapacityKw: 60,
    latitude: '33.0827° N',
    longitude: '74.8322° E',
    loadType: 'Government Secretariat',
    connectionPhase: '3 Phase',
    meterConnectionType: 'HT Dedicated Feeder',
    meterNumber: 'MTR-REA-88192',
    sanctionLoadKw: '85 KW',
    instantaneousLoadKw: '51.8 KW',
    gridAvailability: '21 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '100 KVA',
    dgSetMake: 'Kirloskar Green',
    roofCondition: 'Excellent (Flat Concrete Roof)',
    totalRoofAreaSqFt: 10500,
    freeSpaceSolarSqFt: 6900,
    freeSpaceControlRoomSqFt: 200,
    earthPitPosition: 'Open Field Area Behind Record Room',
    routingAcCableMtr: 38,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Custom Elevated Solar Structure',
    ageOfBuilding: '9 Years',
    accessToRoof: 'Dual Concrete Stairways',
    rooftopHeightMtr: 12.0,
    parapetHeightMtr: 1.3,
    noOfFloors: 'G + 2',
    accessToSite: 'Wide 4-Lane Approach Road',
    distanceFromMainRoadKm: 0.05,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.png',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
  {
    srNo: 8,
    uniqueId: 'JK-PNC-SRT-008',
    state: 'Jammu & Kashmir',
    district: 'Poonch',
    department: 'Health & Medical Education Department',
    siteName: 'District Hospital Poonch',
    siteAddress: 'Hospital Road, Poonch, J&K - 185101',
    caNo: 'CA-PNC-772901',
    surveyAddress: 'OPD & Emergency Block Rooftop',
    nearestLandmark: 'Near Poonch Fort',
    contactPerson: 'Dr. Zulifkar Ali (Medical Officer)',
    contactNo: '+91 94191 99221',
    proposedCapacityKw: 45,
    latitude: '33.7667° N',
    longitude: '74.1000° E',
    loadType: 'Hospital Critical Care',
    connectionPhase: '3 Phase',
    meterConnectionType: 'LT-CT Metered',
    meterNumber: 'MTR-PNC-44910',
    sanctionLoadKw: '60 KW',
    instantaneousLoadKw: '38.4 KW',
    gridAvailability: '20.5 Hours / Day',
    isAllThreePhaseInLtdb: 'Yes',
    missingPhase: 'None',
    ltdbPresent: 'Yes',
    isExistingDgSet: 'Yes',
    dgSetCapacity: '82.5 KVA',
    dgSetMake: 'Cummins',
    roofCondition: 'Good (RCC Surface)',
    totalRoofAreaSqFt: 8100,
    freeSpaceSolarSqFt: 5100,
    freeSpaceControlRoomSqFt: 160,
    earthPitPosition: 'Courtyard Boundary Corner',
    routingAcCableMtr: 30,
    typeOfRoof: 'RCC Flat Roof',
    typeOfStructureRequired: 'Heavy-Duty Galvanized Structure (Wind 160 km/h)',
    ageOfBuilding: '11 Years',
    accessToRoof: 'Full Access Staircase',
    rooftopHeightMtr: 10.5,
    parapetHeightMtr: 1.2,
    noOfFloors: 'G + 2',
    accessToSite: 'Direct Main Road Access',
    distanceFromMainRoadKm: 0.08,
    buildingImage: '/images/panleimg.jpg',
    roofImage: '/images/solar-panel-field.jpg',
    controlRoomImage: '/images/panleimg.jpg',
    otherImage: '/images/solar-panel-bg.png',
    pdfUrl: '#',
  },
];

export function ViewData() {
  const [data, setData] = useState<JammuSurveyRecord[]>(INITIAL_SURVEY_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [phaseFilter, setPhaseFilter] = useState('All');

  // Modals state
  const [activeRecord, setActiveRecord] = useState<JammuSurveyRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; src: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Distinct dropdown options
  const districts = useMemo(() => {
    const list = Array.from(new Set(INITIAL_SURVEY_DATA.map((d) => d.district)));
    return ['All', ...list];
  }, []);

  const departments = useMemo(() => {
    const list = Array.from(new Set(INITIAL_SURVEY_DATA.map((d) => d.department)));
    return ['All', ...list];
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        row.uniqueId.toLowerCase().includes(q) ||
        row.siteName.toLowerCase().includes(q) ||
        row.siteAddress.toLowerCase().includes(q) ||
        row.district.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q) ||
        row.caNo.toLowerCase().includes(q) ||
        row.contactPerson.toLowerCase().includes(q) ||
        row.contactNo.includes(q);

      const matchDistrict = districtFilter === 'All' || row.district === districtFilter;
      const matchDept = deptFilter === 'All' || row.department === deptFilter;
      const matchPhase = phaseFilter === 'All' || row.connectionPhase === phaseFilter;

      return matchSearch && matchDistrict && matchDept && matchPhase;
    });
  }, [data, searchQuery, districtFilter, deptFilter, phaseFilter]);

  // Use the universal pagination from common folder (matching Grid.js)
  const {
    paged,
    curPage,
    pageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    pageList,
    setPage,
    setPageSize,
  } = usePagination({
    data: filteredData,
    initialPageSize: 8,
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDistrictFilter('All');
    setDeptFilter('All');
    setPhaseFilter('All');
    setPage(1);
  };

  const handleDelete = (uniqueId: string) => {
    setData((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    setDeleteConfirmId(null);
  };

  // CSV Export
  const exportToCsv = () => {
    if (!filteredData.length) return;
    const headers = [
      'Sr. No.', 'Unique ID', 'State', 'District', 'Department', 'Site Name', 'Site Address', 'CA No.',
      'Survey Address', 'Nearest Landmark', 'Name Of Current Contact Person', 'Contact No',
      'Proposed Capacity (In KW)', 'Latitude', 'Longitude', 'Load Type', 'Connection Phase',
      'Meter Connection Type', 'Meter Number', 'Sanction Load (KW/KVA)', 'Instantaneous/Corrected Load (KW)',
      'Grid Availability', 'Is All Three Phase Available In LTDB', 'Missing Phase', 'LTDB Present',
      'Is Existing DG SET', 'Dg SET Capacity', 'Dg SET Make', 'Roof Condition',
      'Total Roof Area (Sq.Feet)', 'Free Space for Solar Installation (in Sq.Feet)',
      'Free Space for Control Room/Inverter (in Sq.Feet)', 'Earth Pit Position',
      'Routing of AC Cable from System Area (mtr)', 'Type of Roof', 'Type of Structure Required',
      'Age Of Building', 'Access To The Roof', 'Rooftop Height (mtr)', 'Parapet Height (mtr)',
      'No. of Floors (G+...)', 'Access To Site', 'Distance Of Site From Main Road(km)'
    ];

    const rows = filteredData.map((r) => [
      r.srNo, `"${r.uniqueId}"`, `"${r.state}"`, `"${r.district}"`, `"${r.department}"`,
      `"${r.siteName}"`, `"${r.siteAddress}"`, `"${r.caNo}"`, `"${r.surveyAddress}"`,
      `"${r.nearestLandmark}"`, `"${r.contactPerson}"`, `"${r.contactNo}"`, r.proposedCapacityKw,
      `"${r.latitude}"`, `"${r.longitude}"`, `"${r.loadType}"`, `"${r.connectionPhase}"`,
      `"${r.meterConnectionType}"`, `"${r.meterNumber}"`, `"${r.sanctionLoadKw}"`,
      `"${r.instantaneousLoadKw}"`, `"${r.gridAvailability}"`, `"${r.isAllThreePhaseInLtdb}"`,
      `"${r.missingPhase}"`, `"${r.ltdbPresent}"`, `"${r.isExistingDgSet}"`, `"${r.dgSetCapacity}"`,
      `"${r.dgSetMake}"`, `"${r.roofCondition}"`, r.totalRoofAreaSqFt, r.freeSpaceSolarSqFt,
      r.freeSpaceControlRoomSqFt, `"${r.earthPitPosition}"`, r.routingAcCableMtr, `"${r.typeOfRoof}"`,
      `"${r.typeOfStructureRequired}"`, `"${r.ageOfBuilding}"`, `"${r.accessToRoof}"`,
      r.rooftopHeightMtr, r.parapetHeightMtr, `"${r.noOfFloors}"`, `"${r.accessToSite}"`,
      r.distanceFromMainRoadKm
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jammu_SRT_Survey_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHead
        title="Jammu SRT 70MW Survey Records"
        subtitle="Comprehensive 49-field technical survey records and rooftop solar site assessments across Jammu & Kashmir districts."
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={exportToCsv}
              title="Export visible records to CSV"
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                <path d="M7 11l5 5l5 -5" />
                <path d="M12 4l0 12" />
              </svg>
              <span className="ax-btn__label">Export CSV</span>
            </button>
            <Link
              className="ax-btn ax-btn--primary ax-btn--sm"
              to="/jammu/add-srt-new"
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
              <span className="ax-btn__label">Add New Site</span>
            </Link>
          </div>
        }
      />

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Jammu Survey Master Table">
          {/* TOP TOOLBAR: Search & Filters matching Grid.js layout */}
          <div className="ax-card__header" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-3)', alignItems: 'center' }}>
            <div className="ax-card__titles">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
                <h2 className="ax-card__title">Site Survey Data Ledger</h2>
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
                  {filteredData.length} Sites
                </span>
              </div>
              <p className="ax-card__subtitle">
                Scroll horizontally to view all 49 engineering survey parameters
              </p>
            </div>

            <div className="ax-card__actions" style={{ flexWrap: 'wrap', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
              {/* Universal Search from common folder (Grid.js style) */}
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setPage(1);
                }}
                placeholder="Search ID, Site, CA, Person…"
                size="sm"
                style={{ minWidth: 220 }}
              />

              {/* District Filter */}
              <select
                className="ax-input ax-input--sm"
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: 'auto', minWidth: 120 }}
                aria-label="Filter by District"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Districts' : d}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                className="ax-input ax-input--sm"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: 'auto', minWidth: 130 }}
                aria-label="Filter by Department"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept.split('(')[0].trim()}
                  </option>
                ))}
              </select>

              {/* Clear filters button */}
              {(searchQuery || districtFilter !== 'All' || deptFilter !== 'All' || phaseFilter !== 'All') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={clearFilters}
                  title="Clear all active filters"
                >
                  <span className="ax-btn__label">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* TABLE CONTAINER WITH HORIZONTAL SCROLL & FROZEN HEADERS */}
          <div
            className="ax-table-wrap"
            style={{
              overflowX: 'auto',
              maxHeight: 'calc(100vh - 320px)',
              position: 'relative',
              borderTop: '1px solid var(--ax-border)',
            }}
          >
            <table className="ax-table ax-table--hover ax-table--striped" style={{ minWidth: 4200, fontSize: 'var(--ax-text-xs)' }}>
              <thead className="ax-table__head" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--ax-surface-solid)' }}>
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60, textAlign: 'center', position: 'sticky', left: 0, background: 'var(--ax-surface-solid)', zIndex: 12, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col" style={{ width: 130, position: 'sticky', left: 60, background: 'var(--ax-surface-solid)', zIndex: 12, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)' }}>Unique ID</th>
                  <th className="ax-table__th" scope="col" style={{ width: 120 }}>State</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>District</th>
                  <th className="ax-table__th" scope="col" style={{ width: 180 }}>Department</th>
                  <th className="ax-table__th" scope="col" style={{ width: 220 }}>Site Name</th>
                  <th className="ax-table__th" scope="col" style={{ width: 220 }}>Site Address</th>
                  <th className="ax-table__th" scope="col" style={{ width: 120 }}>CA No.</th>
                  <th className="ax-table__th" scope="col" style={{ width: 200 }}>Survey Address</th>
                  <th className="ax-table__th" scope="col" style={{ width: 180 }}>Nearest Landmark</th>
                  <th className="ax-table__th" scope="col" style={{ width: 180 }}>Name Of Current Contact Person</th>
                  <th className="ax-table__th" scope="col" style={{ width: 130 }}>Contact No</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 140 }}>Proposed Capacity (In KW)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>Latitude</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>Longitude</th>
                  <th className="ax-table__th" scope="col" style={{ width: 140 }}>Load Type</th>
                  <th className="ax-table__th" scope="col" style={{ width: 110 }}>Connection Phase</th>
                  <th className="ax-table__th" scope="col" style={{ width: 140 }}>Meter Connection Type</th>
                  <th className="ax-table__th" scope="col" style={{ width: 130 }}>Meter Number</th>
                  <th className="ax-table__th" scope="col" style={{ width: 140 }}>Sanction Load (KW/KVA)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 160 }}>Instantaneous/Corrected Load (KW)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 130 }}>Grid Availability</th>
                  <th className="ax-table__th" scope="col" style={{ width: 180 }}>Is All Three Phase Available In LTDB</th>
                  <th className="ax-table__th" scope="col" style={{ width: 110 }}>Missing Phase</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>LTDB Present</th>
                  <th className="ax-table__th" scope="col" style={{ width: 120 }}>Is Existing DG SET</th>
                  <th className="ax-table__th" scope="col" style={{ width: 120 }}>Dg SET Capacity</th>
                  <th className="ax-table__th" scope="col" style={{ width: 120 }}>Dg SET Make</th>
                  <th className="ax-table__th" scope="col" style={{ width: 150 }}>Roof Condition</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 140 }}>Total Roof Area (Sq.Feet)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 170 }}>Free Space for Solar Installation (in Sq.Feet)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 180 }}>Free Space for Control Room/Inverter (in Sq.Feet)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 180 }}>Earth Pit Position</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 170 }}>Routing of AC Cable from System Area (mtr)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 140 }}>Type of Roof</th>
                  <th className="ax-table__th" scope="col" style={{ width: 220 }}>Type of Structure Required</th>
                  <th className="ax-table__th" scope="col" style={{ width: 110 }}>Age Of Building</th>
                  <th className="ax-table__th" scope="col" style={{ width: 150 }}>Access To The Roof</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 130 }}>Rooftop Height (mtr)</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 130 }}>Parapet Height (mtr)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 130 }}>No. of Floors (G+...)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 160 }}>Access To Site</th>
                  <th className="ax-table__th ax-table__th--num" scope="col" style={{ width: 170 }}>Distance Of Site From Main Road(km)</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100, textAlign: 'center' }}>Building Image</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100, textAlign: 'center' }}>Roof Image</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100, textAlign: 'center' }}>Control Room</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100, textAlign: 'center' }}>Other Image</th>
                  <th className="ax-table__th" scope="col" style={{ width: 90, textAlign: 'center' }}>PDF</th>
                  <th className="ax-table__th" scope="col" style={{ width: 130, textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-solid)', zIndex: 12, boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.1)' }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {paged.length > 0 ? (
                  paged.map((row) => (
                    <tr key={row.uniqueId} className="ax-table__row">
                      {/* 1. Sr. No. (Sticky) */}
                      <td className="ax-table__td ax-num" style={{ textAlign: 'center', position: 'sticky', left: 0, background: 'var(--ax-surface-solid)', zIndex: 5, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)' }}>
                        {row.srNo}
                      </td>

                      {/* 2. Unique ID (Sticky) */}
                      <td className="ax-table__td ax-num" style={{ position: 'sticky', left: 60, background: 'var(--ax-surface-solid)', zIndex: 5, boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)' }}>
                        <button
                          type="button"
                          onClick={() => setActiveRecord(row)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--ax-accent)',
                            fontWeight: 600,
                            fontFamily: 'var(--ax-font-mono)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {row.uniqueId}
                        </button>
                      </td>

                      {/* 3. State */}
                      <td className="ax-table__td">{row.state}</td>

                      {/* 4. District */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--sm">
                          {row.district}
                        </span>
                      </td>

                      {/* 5. Department */}
                      <td className="ax-table__td ax-text-truncate" style={{ maxWidth: 180 }} title={row.department}>
                        {row.department}
                      </td>

                      {/* 6. Site Name */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        {row.siteName}
                      </td>

                      {/* 7. Site Address */}
                      <td className="ax-table__td ax-text-truncate" style={{ maxWidth: 220 }} title={row.siteAddress}>
                        {row.siteAddress}
                      </td>

                      {/* 8. CA No. */}
                      <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                        {row.caNo}
                      </td>

                      {/* 9. Survey Address */}
                      <td className="ax-table__td ax-text-truncate" style={{ maxWidth: 200 }} title={row.surveyAddress}>
                        {row.surveyAddress}
                      </td>

                      {/* 10. Nearest Landmark */}
                      <td className="ax-table__td">{row.nearestLandmark}</td>

                      {/* 11. Contact Person */}
                      <td className="ax-table__td" style={{ fontWeight: 500 }}>
                        {row.contactPerson}
                      </td>

                      {/* 12. Contact No */}
                      <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                        {row.contactNo}
                      </td>

                      {/* 13. Proposed Capacity */}
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 700, color: 'var(--ax-accent)' }}>
                        {row.proposedCapacityKw} KW
                      </td>

                      {/* 14. Latitude */}
                      <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{row.latitude}</td>

                      {/* 15. Longitude */}
                      <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{row.longitude}</td>

                      {/* 16. Load Type */}
                      <td className="ax-table__td">{row.loadType}</td>

                      {/* 17. Connection Phase */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--sm">
                          {row.connectionPhase}
                        </span>
                      </td>

                      {/* 18. Meter Connection Type */}
                      <td className="ax-table__td">{row.meterConnectionType}</td>

                      {/* 19. Meter Number */}
                      <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{row.meterNumber}</td>

                      {/* 20. Sanction Load */}
                      <td className="ax-table__td ax-num">{row.sanctionLoadKw}</td>

                      {/* 21. Instantaneous Load */}
                      <td className="ax-table__td ax-num">{row.instantaneousLoadKw}</td>

                      {/* 22. Grid Availability */}
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--sm">
                          {row.gridAvailability}
                        </span>
                      </td>

                      {/* 23. Is All 3 Phase in LTDB */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{row.isAllThreePhaseInLtdb}</td>

                      {/* 24. Missing Phase */}
                      <td className="ax-table__td">{row.missingPhase}</td>

                      {/* 25. LTDB Present */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{row.ltdbPresent}</td>

                      {/* 26. Is Existing DG Set */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>{row.isExistingDgSet}</td>

                      {/* 27. DG Set Capacity */}
                      <td className="ax-table__td ax-num">{row.dgSetCapacity}</td>

                      {/* 28. DG Set Make */}
                      <td className="ax-table__td">{row.dgSetMake}</td>

                      {/* 29. Roof Condition */}
                      <td className="ax-table__td">{row.roofCondition}</td>

                      {/* 30. Total Roof Area */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.totalRoofAreaSqFt.toLocaleString()} sq ft</td>

                      {/* 31. Free Space for Solar */}
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ fontWeight: 600, color: 'var(--ax-viz-emerald)' }}>
                        {row.freeSpaceSolarSqFt.toLocaleString()} sq ft
                      </td>

                      {/* 32. Free Space for Control Room */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.freeSpaceControlRoomSqFt.toLocaleString()} sq ft</td>

                      {/* 33. Earth Pit Position */}
                      <td className="ax-table__td ax-text-truncate" style={{ maxWidth: 180 }} title={row.earthPitPosition}>
                        {row.earthPitPosition}
                      </td>

                      {/* 34. Routing AC Cable */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.routingAcCableMtr} m</td>

                      {/* 35. Type of Roof */}
                      <td className="ax-table__td">{row.typeOfRoof}</td>

                      {/* 36. Type of Structure */}
                      <td className="ax-table__td ax-text-truncate" style={{ maxWidth: 220 }} title={row.typeOfStructureRequired}>
                        {row.typeOfStructureRequired}
                      </td>

                      {/* 37. Age of Building */}
                      <td className="ax-table__td">{row.ageOfBuilding}</td>

                      {/* 38. Access to Roof */}
                      <td className="ax-table__td">{row.accessToRoof}</td>

                      {/* 39. Rooftop Height */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.rooftopHeightMtr} m</td>

                      {/* 40. Parapet Height */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.parapetHeightMtr} m</td>

                      {/* 41. No. of Floors */}
                      <td className="ax-table__td">{row.noOfFloors}</td>

                      {/* 42. Access to Site */}
                      <td className="ax-table__td">{row.accessToSite}</td>

                      {/* 43. Distance from Main Road */}
                      <td className="ax-table__td ax-table__td--num ax-num">{row.distanceFromMainRoadKm} km</td>

                      {/* 44. Building Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} - Building Image`, src: row.buildingImage })}
                          title="View Building Photo"
                        >
                          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                        </button>
                      </td>

                      {/* 45. Roof Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} - Roof Photo`, src: row.roofImage })}
                          title="View Roof Photo"
                        >
                          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                        </button>
                      </td>

                      {/* 46. Control Room Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} - Control Room`, src: row.controlRoomImage })}
                          title="View Control Room Photo"
                        >
                          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                        </button>
                      </td>

                      {/* 47. Other Image */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                          onClick={() => setPreviewImage({ title: `${row.siteName} - Additional Photo`, src: row.otherImage })}
                          title="View Other Photo"
                        >
                          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 8h.01" /><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12" /><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" /><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
                          </svg>
                        </button>
                      </td>

                      {/* 48. PDF */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill"
                          onClick={() => alert(`Downloading Technical Survey PDF for site ${row.uniqueId}`)}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Download Survey Report PDF"
                        >
                          PDF
                        </button>
                      </td>

                      {/* 49. Action (Sticky) */}
                      <td className="ax-table__td" style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-solid)', zIndex: 5, boxShadow: '-2px 0 4px -2px rgba(0,0,0,0.06)' }}>
                        <div className="ax-cluster" style={{ gap: 4, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                            onClick={() => setActiveRecord(row)}
                            title="View Full 49-Field Dossier"
                          >
                            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                            </svg>
                          </button>
                          <Link
                            className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                            to="/jammu/add-srt-new"
                            title="Edit Survey Record"
                          >
                            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                              <path d="M13.5 6.5l4 4" />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--xs"
                            onClick={() => setDeleteConfirmId(row.uniqueId)}
                            style={{ color: 'var(--ax-viz-red)' }}
                            title="Delete Record"
                          >
                            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 7l16 0" />
                              <path d="M10 11l0 6" />
                              <path d="M14 11l0 6" />
                              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // EXACT USER SPECIFICATION: No data available in table
                  <tr>
                    <td
                      colSpan={49}
                      style={{
                        textAlign: 'center',
                        padding: 'var(--ax-space-12) var(--ax-space-6)',
                        color: 'var(--ax-text-muted)',
                        fontSize: 'var(--ax-text-md)',
                        background: 'var(--ax-surface-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-3)' }}>
                        <span
                          className="ax-avatar ax-avatar--lg ax-avatar--squircle"
                          style={{ background: 'var(--ax-surface-solid)', color: 'var(--ax-text-subtle)' }}
                        >
                          <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                            <path d="M21 21l-6 -6" />
                          </svg>
                        </span>
                        <div style={{ fontWeight: 600, color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-lg)' }}>
                          No data available in table
                        </div>
                        <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
                          No matching survey records found for the current search query or active filter.
                        </p>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={clearFilters}
                          style={{ marginTop: 'var(--ax-space-2)' }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER PAGINATION (matching Grid.js markup from common folder) */}
          {filteredData.length > 0 && (
            <div style={{ padding: 'var(--ax-space-3) var(--ax-space-5)', borderTop: '1px solid var(--ax-border)' }}>
              <Pagination
                curPage={curPage}
                total={filteredData.length}
                pageSize={pageSize}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                setPage={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 8, 15, 25, 50]}
              />
            </div>
          )}
        </section>
      </div>

      {/* MODAL 1: FULL 49-FIELD DOSSIER */}
      {activeRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Survey Details: ${activeRecord.uniqueId}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: 'var(--ax-space-4)',
          }}
          onClick={() => setActiveRecord(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 920,
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 0,
              boxShadow: 'var(--ax-shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ax-card__header" style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--ax-surface-solid)', borderBottom: '1px solid var(--ax-border)' }}>
              <div className="ax-card__titles">
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
                    {activeRecord.uniqueId}
                  </span>
                  <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                    {activeRecord.proposedCapacityKw} KW Proposed
                  </span>
                </div>
                <h2 className="ax-card__title" style={{ marginTop: 4 }}>
                  {activeRecord.siteName}
                </h2>
                <p className="ax-card__subtitle">
                  {activeRecord.district} District · {activeRecord.department}
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setActiveRecord(null)}
                aria-label="Close dialog"
              >
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
              {/* Category 1: Location & Contact */}
              <div>
                <h4 style={{ margin: '0 0 var(--ax-space-3)', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  1. Location &amp; Contact Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--ax-space-3)' }}>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Site Address</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.siteAddress}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Survey Address / Wing</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.surveyAddress}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Nearest Landmark</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.nearestLandmark}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Contact Person &amp; Phone</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{activeRecord.contactPerson}</div>
                    <div className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{activeRecord.contactNo}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>GPS Coordinates (Lat / Long)</div>
                    <div className="ax-num" style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.latitude}, {activeRecord.longitude}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Distance from Main Road</div>
                    <div className="ax-num" style={{ fontWeight: 600, marginTop: 2 }}>{activeRecord.distanceFromMainRoadKm} km ({activeRecord.accessToSite})</div>
                  </div>
                </div>
              </div>

              {/* Category 2: Electrical & Grid Parameters */}
              <div>
                <h4 style={{ margin: '0 0 var(--ax-space-3)', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  2. Electrical, Grid &amp; Metering Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--ax-space-3)' }}>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>CA Number</div>
                    <div className="ax-num" style={{ fontWeight: 600, marginTop: 2 }}>{activeRecord.caNo}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Sanction &amp; Instantaneous Load</div>
                    <div className="ax-num" style={{ fontWeight: 600, marginTop: 2 }}>{activeRecord.sanctionLoadKw} / {activeRecord.instantaneousLoadKw}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Connection Phase &amp; LTDB</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.connectionPhase} · LTDB: {activeRecord.ltdbPresent}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Meter No. &amp; Type</div>
                    <div className="ax-num" style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.meterNumber} ({activeRecord.meterConnectionType})</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Grid Availability</div>
                    <div style={{ fontWeight: 600, color: 'var(--ax-viz-emerald)', marginTop: 2 }}>{activeRecord.gridAvailability}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Existing DG Set</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.isExistingDgSet === 'Yes' ? `${activeRecord.dgSetCapacity} (${activeRecord.dgSetMake})` : 'None'}</div>
                  </div>
                </div>
              </div>

              {/* Category 3: Rooftop, Space & Structural Engineering */}
              <div>
                <h4 style={{ margin: '0 0 var(--ax-space-3)', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  3. Roof, Space &amp; Civil Structural Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--ax-space-3)' }}>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Total Roof Area</div>
                    <div className="ax-num" style={{ fontWeight: 700, fontSize: 'var(--ax-text-md)', marginTop: 2 }}>{activeRecord.totalRoofAreaSqFt.toLocaleString()} sq ft</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0, borderColor: 'var(--ax-accent)' }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-accent)' }}>Free Solar Installation Space</div>
                    <div className="ax-num" style={{ fontWeight: 700, fontSize: 'var(--ax-text-md)', color: 'var(--ax-accent)', marginTop: 2 }}>{activeRecord.freeSpaceSolarSqFt.toLocaleString()} sq ft</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Control Room / Inverter Space</div>
                    <div className="ax-num" style={{ fontWeight: 600, marginTop: 2 }}>{activeRecord.freeSpaceControlRoomSqFt.toLocaleString()} sq ft</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Roof Type &amp; Condition</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.typeOfRoof} ({activeRecord.roofCondition})</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Required Structure Type</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.typeOfStructureRequired}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Cable Routing &amp; Earth Pit</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>Cable: {activeRecord.routingAcCableMtr}m · Pit: {activeRecord.earthPitPosition}</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Building Heights &amp; Floors</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.noOfFloors} · Roof: {activeRecord.rooftopHeightMtr}m · Parapet: {activeRecord.parapetHeightMtr}m</div>
                  </div>
                  <div className="ax-card" style={{ padding: 'var(--ax-space-3)', margin: 0 }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)' }}>Age &amp; Roof Access</div>
                    <div style={{ fontWeight: 500, marginTop: 2 }}>{activeRecord.ageOfBuilding} old · Access: {activeRecord.accessToRoof}</div>
                  </div>
                </div>
              </div>

              {/* Category 4: Media Photos & Documents */}
              <div>
                <h4 style={{ margin: '0 0 var(--ax-space-3)', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  4. Survey Documentation &amp; Photographs
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--ax-space-3)' }}>
                  {[
                    { label: 'Building Image', src: activeRecord.buildingImage },
                    { label: 'Roof Image', src: activeRecord.roofImage },
                    { label: 'Control Room', src: activeRecord.controlRoomImage },
                    { label: 'Other Image', src: activeRecord.otherImage },
                  ].map((img) => (
                    <div
                      key={img.label}
                      className="ax-card"
                      style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', margin: 0 }}
                      onClick={() => setPreviewImage({ title: `${activeRecord.siteName} - ${img.label}`, src: img.src })}
                    >
                      <img src={img.src} alt={img.label} style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                      <div style={{ padding: '6px 10px', fontSize: 'var(--ax-text-xs)', fontWeight: 600, textAlign: 'center' }}>
                        {img.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ax-card__footer" style={{ borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                Survey record verified by KLK Operations Engineering
              </span>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => alert(`Downloading technical assessment PDF for ${activeRecord.uniqueId}`)}
                >
                  Download Survey PDF
                </button>
                <button
                  type="button"
                  className="ax-btn ax-btn--primary"
                  onClick={() => setActiveRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: IMAGE PREVIEW LIGHTBOX */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.title}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: 'var(--ax-space-6)',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              maxWidth: 800,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ax-space-3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--ax-text-md)' }}>{previewImage.title}</span>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setPreviewImage(null)}
                style={{ color: '#fff' }}
              >
                <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <img
              src={previewImage.src}
              alt={previewImage.title}
              style={{
                width: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 'var(--ax-radius-lg)',
                boxShadow: 'var(--ax-shadow-xl)',
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm deletion"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            padding: 'var(--ax-space-4)',
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="ax-card"
            style={{ maxWidth: 420, width: '100%', margin: 0, padding: 'var(--ax-space-6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 var(--ax-space-2)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-lg)' }}>
              Confirm Deletion
            </h3>
            <p style={{ margin: '0 0 var(--ax-space-5)', color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', lineHeight: 1.6 }}>
              Are you sure you want to remove survey record <strong className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{deleteConfirmId}</strong>? This action cannot be undone.
            </p>
            <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 'var(--ax-space-2)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                style={{ background: 'var(--ax-viz-red)', borderColor: 'var(--ax-viz-red)' }}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewData;
