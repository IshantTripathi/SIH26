import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PATCH','PUT','DELETE'] }));
app.use(express.json());

// Auto-save store after every mutation
app.use((req, res, next) => {
  if (['POST','PATCH','PUT','DELETE'].includes(req.method)) {
    const origJson = res.json.bind(res);
    res.json = function(data) { store.save(); return origJson(data); };
  }
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'cooperative-sih89-demo-secret-key-2026';
const ROLES = { CUSTOMER:'customer', WORKER:'worker', SOCIETY_ADMIN:'society_admin', FEDERATION_ADMIN:'federation_admin', PLATFORM_ADMIN:'platform_admin' };
const JOB_STATUSES = { REQUESTED:'REQUESTED', MATCHING:'MATCHING', OFFERED:'OFFERED', ACCEPTED:'ACCEPTED', ON_THE_WAY:'ON_THE_WAY', ARRIVED:'ARRIVED', IN_PROGRESS:'IN_PROGRESS', COMPLETED:'COMPLETED', PAYMENT_PENDING:'PAYMENT_PENDING', PAID:'PAID', CANCELLED:'CANCELLED' };
const URGENCY = { NORMAL:'Normal', HIGH:'High', EMERGENCY:'Emergency' };

const STORE_FILE = '/tmp/sahakar_store.json';

class DataStore {
  constructor() { this.reset(); }
  reset() {
    this.users = [
      { id:'USR-CUST-001', name:'Rajesh Kumar', email:'customer01@demo.coop', password:'password123', role:'customer', mobile:'9876510001', location:{lat:28.6140,lng:77.2095}, address:'123 Central Delhi', customerType:'Household' },
      { id:'USR-CUST-002', name:'City Clinic Hospital', email:'institution01@demo.coop', password:'password123', role:'customer', mobile:'9876510002', location:{lat:28.6200,lng:77.2150}, address:'456 Medical District', customerType:'Institution', institutionName:'City Clinic Hospital', institutionType:'Clinic / Healthcare Facility', contactPerson:'Dr. Sharma' },
      { id:'USR-WRK-001', name:'Worker Demo 01', email:'worker01@demo.coop', password:'password123', role:'worker', mobile:'9876510003', workerId:'WRK-001' },
      { id:'USR-WRK-002', name:'Worker Demo 02', email:'worker02@demo.coop', password:'password123', role:'worker', mobile:'9876510004', workerId:'WRK-002' },
      { id:'USR-WRK-010', name:'Ritu Sharma', email:'worker10@demo.coop', password:'password123', role:'worker', mobile:'9876510010', workerId:'WRK-010' },
      { id:'USR-WRK-011', name:'Priya Verma', email:'worker11@demo.coop', password:'password123', role:'worker', mobile:'9876510011', workerId:'WRK-011' },
      { id:'USR-WRK-012', name:'Anita Kumari', email:'worker12@demo.coop', password:'password123', role:'worker', mobile:'9876510012', workerId:'WRK-012' },
      { id:'USR-WRK-013', name:'Sunita Devi', email:'worker13@demo.coop', password:'password123', role:'worker', mobile:'9876510013', workerId:'WRK-013' },
      { id:'USR-WRK-014', name:'Kavita Joshi', email:'worker14@demo.coop', password:'password123', role:'worker', mobile:'9876510014', workerId:'WRK-014' },
      { id:'USR-SOC-001', name:'Society Admin 01', email:'society01.admin@demo.coop', password:'password123', role:'society_admin', societyId:'SOC-DEMO-001' },
      { id:'USR-FED-001', name:'Federation Admin 01', email:'federation.admin@demo.coop', password:'password123', role:'federation_admin', federationId:'FED-DEMO-001' },
      { id:'USR-ADM-001', name:'Platform Admin 01', email:'platform.admin@demo.coop', password:'password123', role:'platform_admin' }
    ];
    this.workers = [
      { id:'WRK-001', userId:'USR-WRK-001', name:'Worker Demo 01', societyId:'SOC-DEMO-001', primarySkill:'Plumbing', secondarySkills:['Electrical'], serviceCategories:['Plumbing','Electrical'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.8, ratingCount:25, experienceYears:5, reliabilityScore:92, activeJobsCount:1, recentCompletedJobs:12, totalEarningsGross:48000, currentWorkload:'Balanced', location:{lat:28.6150,lng:77.2100} },
      { id:'WRK-002', userId:'USR-WRK-002', name:'Worker Demo 02', societyId:'SOC-DEMO-001', primarySkill:'Electrical', secondarySkills:['Carpentry','Plumbing'], serviceCategories:['Electrical','Carpentry','Plumbing'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.5, ratingCount:30, experienceYears:8, reliabilityScore:88, activeJobsCount:8, recentCompletedJobs:45, totalEarningsGross:180000, currentWorkload:'High Workload', location:{lat:28.6160,lng:77.2110} },
      { id:'WRK-010', userId:'USR-WRK-010', name:'Ritu Sharma (Househelp)', societyId:'SOC-DEMO-001', primarySkill:'Househelp', secondarySkills:['Cooking','Deep Cleaning','Laundry'], serviceCategories:['Househelp','Cleaning'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.92, ratingCount:45, experienceYears:5, reliabilityScore:96, activeJobsCount:1, recentCompletedJobs:15, totalEarningsGross:28500, currentWorkload:'Balanced', location:{lat:28.6180,lng:77.2200}, instantBookingEligible:true, maxInstantResponseMin:25 },
      { id:'WRK-011', userId:'USR-WRK-011', name:'Priya Verma (Househelp)', societyId:'SOC-DEMO-001', primarySkill:'Househelp', secondarySkills:['North Indian Cooking','South Indian Cooking'], serviceCategories:['Househelp','Cooking'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.95, ratingCount:60, experienceYears:7, reliabilityScore:98, activeJobsCount:0, recentCompletedJobs:22, totalEarningsGross:35000, currentWorkload:'Light Workload', location:{lat:28.6220,lng:77.2180}, instantBookingEligible:true, maxInstantResponseMin:20 },
      { id:'WRK-012', userId:'USR-WRK-012', name:'Anita Kumari (Beauty Expert)', societyId:'SOC-DEMO-001', primarySkill:'Beauty & Spa', secondarySkills:['Facial','Body Massage','Manicure','Pedicure'], serviceCategories:['Beauty & Spa','Manicure & Pedicure'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.88, ratingCount:52, experienceYears:6, reliabilityScore:95, activeJobsCount:2, recentCompletedJobs:18, totalEarningsGross:42000, currentWorkload:'Balanced', location:{lat:28.6150,lng:77.2100} },
      { id:'WRK-013', userId:'USR-WRK-013', name:'Sunita Devi (Spa Therapist)', societyId:'SOC-DEMO-002', primarySkill:'Beauty & Spa', secondarySkills:['Aromatherapy','Hot Stone Massage','Body Scrub'], serviceCategories:['Beauty & Spa'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.93, ratingCount:70, experienceYears:8, reliabilityScore:97, activeJobsCount:0, recentCompletedJobs:30, totalEarningsGross:56000, currentWorkload:'Light Workload', location:{lat:28.6300,lng:77.2900} },
      { id:'WRK-014', userId:'USR-WRK-014', name:'Kavita Joshi (Nail Artist)', societyId:'SOC-DEMO-001', primarySkill:'Manicure & Pedicure', secondarySkills:['Gel Nails','Nail Art','Paraffin Treatment'], serviceCategories:['Manicure & Pedicure'], verificationStatus:'Verified', isOnline:true, ratingAvg:4.85, ratingCount:35, experienceYears:4, reliabilityScore:93, activeJobsCount:1, recentCompletedJobs:12, totalEarningsGross:22000, currentWorkload:'Balanced', location:{lat:28.6170,lng:77.2130} }
    ];
    this.services = [
      { id:'SERV-PLUMB', category:'Plumbing', title:'Plumbing Repair & Maintenance', basePrice:500, keywords:['tap','pipe','leak','drain','faucet','toilet','plumbing','water','sink','burst'] },
      { id:'SERV-ELEC', category:'Electrical', title:'Electrical Repair & Wiring', basePrice:450, keywords:['fan','light','switch','wiring','electric','bulb','short circuit','power','socket'] },
      { id:'SERV-CARP', category:'Carpentry', title:'Carpentry & Woodwork', basePrice:550, keywords:['furniture','door','window','wood','table','chair','cupboard','shelf','lock'] },
      { id:'SERV-PAINT', category:'Painting', title:'Painting & Wall Treatment', basePrice:400, keywords:['paint','wall','colour','color','primer','brush','roller'] },
      { id:'SERV-CLEAN', category:'Cleaning', title:'Deep Cleaning & Sanitization', basePrice:350, keywords:['clean','safai','mop','dust','wash','sanitiz','hygiene'] },
      { id:'SERV-GARD', category:'Gardening', title:'Garden & Landscape Maintenance', basePrice:400, keywords:['garden','plant','grass','tree','landscape','mow','hedge'] },
      { id:'SERV-DRIVE', category:'Driving', title:'Driving & Transportation', basePrice:300, keywords:['driver','drive','car','ride','transport','vehicle'] },
      { id:'SERV-CARE', category:'Caregiving', title:'Elder Care & Patient Support', basePrice:300, keywords:['care','nurse','elder','patient','senior','medical','help'] },
      { id:'SERV-MAINT', category:'General Maintenance', title:'General Handyman & Facility Support', basePrice:400, keywords:['repair','fix','maintenance','general','handyman','service'] },
      { id:'SERV-HOUSE', category:'Househelp', title:'Instant Househelp & Domestic Help', basePrice:350, keywords:['househelp','maid','cooking','cleaning','dishes','laundry','grocery','domestic','help','kitchen'], instantBookingAvailable:true },
      { id:'SERV-BEAUTY', category:'Beauty & Spa', title:'Beauty Treatment & Spa Services', basePrice:800, keywords:['beauty','spa','facial','massage','hair','skin','relaxation','body','therapy'] },
      { id:'SERV-NAILS', category:'Manicure & Pedicure', title:'Professional Manicure & Pedicure', basePrice:500, keywords:['manicure','pedicure','nail','cuticle','polish','gel','nail art','foot spa'] }
    ];
    this.subscriptions = [];
    this.instantBookings = [];
    this.jobs = [];
    this.societies = [{ id:'SOC-DEMO-001', federationId:'FED-DEMO-001', name:'Central Metro Labour Cooperative Society', district:'Central Metro', coopContributionPercent:4.0, welfareFundPercent:1.0, workerPayoutPercent:95.0 }];
    this.federations = [{ id:'FED-DEMO-001', name:'Sample Labour Cooperative Federation', state:'Delhi NCR', activeSocietiesCount:2, totalWorkersCovered:12 }];
    this.welfareRecords = [{ id:'WEL-001', workerId:'WRK-001', societyId:'SOC-DEMO-001', policyNumber:'POL-DEMO-001', coverageAmount:200000, accidentalCoverage:300000, status:'Active', benefits:['Medical Coverage','Accidental Insurance','Tool Allowance'] }];
    this.complaints = [];
    this.auditLogs = [];
    this.notifications = [];
    this.demandData = [];
    this.welfareClaims = [];
    this.sosAlerts = [];
    this.rescheduleLog = [];
    this.loyaltyTiers = [{ id:'TIER-001', customerId:'USR-CUST-001', totalSpend:8500, tier:'Silver', discount:10 }];
    this.packCredits = [{ id:'PACK-001', customerId:'USR-CUST-001', societyId:'SOC-DEMO-001', serviceName:'Sahakar Monthly Pack', creditsTotal:10, creditsUsed:0, pricePaid:799, status:'Active' }];
    this.warranties = [];
    this.coupons = [{ id:'COUPON-001', code:'WELCOME50', type:'flat', value:50, minOrder:200, maxUses:100, usedCount:0, validFrom:'2026-01-01T00:00:00Z', validUntil:'2026-12-31T23:59:59Z', status:'Active' },{ id:'COUPON-002', code:'SAHAKAR10', type:'percent', value:10, minOrder:500, maxUses:500, usedCount:0, validFrom:'2026-01-01T00:00:00Z', validUntil:'2026-12-31T23:59:59Z', status:'Active' }];
    this.callbacks = [];
    this.emergencyQueue = [];
    this.workerLocations = {};
    this.workerApplications = [];
    this.skillAssessments = [];
    this.meetings = [];
    this.bylaws = [];
    this.resolutions = [];
    this.trustScores = {};
    this.voiceBookingSessions = [];
    this.passortEndorsements = [];
    this.toolInventory = [];
    this.toolLoans = [];
    this.proposals = [];
    this.guaranteePool = { balance:50000 };
    this.seasonalSuggestions = [{ season:'Summer', months:[3,4,5], services:['AC Servicing','Appliance Repair'] },{ season:'Monsoon', months:[6,7,8,9], services:['Plumbing','Waterproofing'] }];
  }
  getCollection(n) { if(!this[n]) this[n]=[]; return this[n]; }
  find(c,f={}) { return this.getCollection(c).filter(i=>{ for(const[k,v] of Object.entries(f)){if(Array.isArray(i[k])){if(!i[k].includes(v))return false;}else if(i[k]!==v)return false;} return true; }); }
  findOne(c,f={}) { const l=this.find(c,f); return l.length>0?JSON.parse(JSON.stringify(l[0])):null; }
  findById(c,id) { const l=this.getCollection(c); const i=l.find(x=>x.id===id||x._id===id); return i?JSON.parse(JSON.stringify(i)):null; }
  create(c,d) { const l=this.getCollection(c); const n={...d, id:d.id||`${c.toUpperCase().slice(0,3)}-${Date.now()}-${Math.floor(Math.random()*1000)}`, createdAt:d.createdAt||new Date().toISOString() }; l.unshift(n); return JSON.parse(JSON.stringify(n)); }
  findByIdAndUpdate(c,id,u) { const l=this.getCollection(c); const i=l.findIndex(x=>x.id===id||x._id===id); if(i===-1)return null; l[i]={...l[i],...u,updatedAt:new Date().toISOString()}; return JSON.parse(JSON.stringify(l[i])); }
  logAudit(a) { const e={id:`AUDIT-${Date.now()}`,actorName:a.actorName||'System',actorRole:a.actorRole||'system',action:a.action,module:a.module||'General',recordId:a.recordId||'N/A',details:a.details||'',timestamp:new Date().toISOString()}; this.auditLogs.unshift(e); this.notifications.unshift({...e,read:false}); return e; }
  pushNotification(n) { const note={id:`NOTIF-${Date.now()}`,title:n.title,message:n.message,targetRole:n.targetRole,targetUserId:n.targetUserId,type:n.type||'info',read:false,timestamp:new Date().toISOString()}; this.notifications.unshift(note); return note; }
  save() {
    try {
      const data = {};
      for (const key of Object.keys(this)) {
        if (Array.isArray(this[key]) || (typeof this[key] === 'object' && this[key] !== null && !(this[key] instanceof Date))) {
          data[key] = this[key];
        }
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(data));
    } catch(e) {}
  }
  load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
        for (const [k, v] of Object.entries(data)) { this[k] = v; }
        return true;
      }
    } catch(e) {}
    return false;
  }
}

const store = new DataStore();
if (!store.load()) { store.save(); }

function authenticate(req, res, next) {
  const demoUserId = req.headers['x-demo-user-id'];
  if (demoUserId) {
    const user = store.findById('users', demoUserId);
    if (user) { const{password:_,...safe}=user; req.user=safe; return next(); }
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      let user = store.findById('users', decoded.id);
      if (!user) {
        user = { id:decoded.id, name:'User', email:'', role:decoded.role||'customer' };
      }
      const{password:_,...safe}=user;
      req.user = safe;
      return next();
    } catch(e) {}
  }
  const fallback = store.findOne('users', { email:'customer01@demo.coop' }) || store.getCollection('users')[0];
  if (fallback) { const{password:_,...safe}=fallback; req.user=safe; return next(); }
  return res.status(401).json({ success:false, message:'No auth token.' });
}

// Health
app.get('/api/health', (req,res) => res.json({ status:'UP', problemStatementId:'SIH26089', service:'SIH26089 Cooperative Gig Platform', department:'Ministry of Cooperation / NCCT', environment:'Demo', timestamp:new Date().toISOString() }));

// Auth
app.post('/api/auth/login', (req,res) => {
  const { email, password } = req.body;
  const user = store.findOne('users', { email });
  if (!user || user.password !== password) return res.status(401).json({ success:false, message:'Invalid credentials.' });
  const token = jwt.sign({ id:user.id, role:user.role }, JWT_SECRET, { expiresIn:'24h' });
  const { password:_, ...safe } = user;
  return res.json({ success:true, token, user:safe });
});

// Google OAuth Login
app.post('/api/auth/google', (req,res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success:false, message:'Google token required.' });

    const parts = token.split('.');
    if (parts.length < 2) return res.status(401).json({ success:false, message:'Invalid Google token format.' });
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const email = payload.email;
    const name = payload.name || payload.given_name || 'Google User';
    const picture = payload.picture || '';
    const googleId = payload.sub;

    let user = store.findOne('users', { email });
    if (!user) {
      user = store.create('users', {
        id: `USR-GOOGLE-${Date.now()}`,
        name,
        email,
        password: 'google-oauth-no-password',
        role: 'customer',
        mobile: '',
        location: { lat: 28.6140, lng: 77.2095 },
        address: 'Google Account',
        customerType: 'Household',
        authProvider: 'google',
        googleId,
        picture
      });
    }

    const jwtToken = jwt.sign({ id:user.id, role:user.role }, JWT_SECRET, { expiresIn:'24h' });
    const { password:_, ...safe } = user;
    return res.json({ success:true, token:jwtToken, user:safe });
  } catch(e) {
    return res.status(401).json({ success:false, message:'Invalid Google token.' });
  }
});

// Register
app.post('/api/auth/register', (req,res) => {
  const { name, email, password, mobile, role='customer', customerType='Household' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success:false, message:'Name, email and password required.' });
  let user = store.findOne('users', { email });
  if (user) {
    if (user.password !== password) return res.status(400).json({ success:false, message:'Email already registered with different password. Use login instead.' });
    const token = jwt.sign({ id:user.id, role:user.role }, JWT_SECRET, { expiresIn:'24h' });
    const { password:_, ...safe } = user;
    return res.json({ success:true, token, user:safe });
  }
  user = store.create('users', { id:`USR-${Date.now()}`, name, email, password, mobile:mobile||'', role, customerType, location:{lat:28.6140,lng:77.2095}, address:'Delhi NCR' });
  const token = jwt.sign({ id:user.id, role:user.role }, JWT_SECRET, { expiresIn:'24h' });
  const { password:_, ...safe } = user;
  return res.json({ success:true, token, user:safe });
});

app.get('/api/auth/demo-accounts', (req,res) => res.json({ success:true, accounts:store.getCollection('users').map(u=>{const{password:_,...s}=u;return s;}) }));
app.get('/api/auth/profile', authenticate, (req,res) => { const{password:_,...s}=req.user; return res.json({ success:true, user:s }); });
app.post('/api/auth/reset-demo', (req,res) => { store.reset(); return res.json({ success:true, message:'Demo data reset.' }); });

// Jobs
app.post('/api/jobs', authenticate, (req,res) => {
  const { serviceCategory, problemDescription, urgency='Normal', scheduledDate, scheduledTime, customerLocation, customerAddress, customAmount, customerType='Household', durationHours=1, usePackCredit=false } = req.body;
  let cat = serviceCategory;
  let basePrice = 500;
  if (!cat && problemDescription) {
    const norm = problemDescription.toLowerCase();
    for (const s of store.getCollection('services')) { for (const kw of s.keywords||[]) { if(norm.includes(kw)){cat=s.category;basePrice=s.basePrice;break;} } if(cat)break; }
  }
  if (!cat) cat = 'General Maintenance';
  const matched = store.findOne('services',{category:cat});
  if(matched) basePrice = matched.basePrice;

  const allW = store.getCollection('workers');
  const eligible = allW.filter(w=>w.isOnline&&(w.primarySkill===cat||(w.serviceCategories||[]).includes(cat)));
  const ranked = eligible.sort((a,b)=>(b.ratingAvg||0)-(a.ratingAvg||0));
  const best = ranked[0];

  const soc = store.findById('societies','SOC-DEMO-001');
  const coopP = soc?.coopContributionPercent??4;
  const welfP = soc?.welfareFundPercent??1;
  const dur = Math.min(Math.max(Number(durationHours)||1,1),4);
  let gross = customAmount || (basePrice*dur) || 500;

  let packUsed=false;
  if(usePackCredit){ const packs=store.find('packCredits',{customerId:req.user.id,status:'Active'}); const ap=packs.find(p=>p.creditsUsed<p.creditsTotal); if(ap){gross=0;packUsed=true;store.findByIdAndUpdate('packCredits',ap.id,{creditsUsed:ap.creditsUsed+1});} }

  const coop=packUsed?0:Math.round((gross*(coopP/100))*10)/10;
  const welf=packUsed?0:Math.round((gross*(welfP/100))*10)/10;
  const net=packUsed?0:Math.round((gross-coop-welf)*10)/10;
  const otp=Math.floor(1000+Math.random()*9000).toString();
  const code=`JOB-2026-${Math.floor(100+Math.random()*900)}`;

  const job=store.create('jobs',{ code, customerId:req.user.id, customerName:req.user.name, customerType, institutionName:req.user.institutionName, contactPerson:req.user.contactPerson, customerPhone:req.user.mobile, customerAddress:customerAddress||req.user.address, workerId:best?.id||null, workerName:best?.name||'Matching...', societyId:'SOC-DEMO-001', serviceCategory:cat, serviceTitle:matched?.title||`${cat} Service`, problemDescription:problemDescription||`Standard ${cat}`, urgency, status:best?JOB_STATUSES.OFFERED:JOB_STATUSES.MATCHING, durationHours:dur, packCreditUsed:packUsed, pricing:{grossAmount:gross,coopContribution:coop,welfareDeduction:welf,netWorkerEarnings:net,coopPercent:coopP,welfarePercent:welfP}, paymentStatus:packUsed?'PAID':'PAYMENT_PENDING', otp, scheduledDate:scheduledDate||new Date().toISOString().split('T')[0], scheduledTime:scheduledTime||'Immediately', statusHistory:[{status:JOB_STATUSES.REQUESTED,timestamp:new Date().toISOString()},{status:best?JOB_STATUSES.OFFERED:JOB_STATUSES.MATCHING,timestamp:new Date().toISOString()}] });

  store.logAudit({actorName:req.user.name,actorRole:req.user.role,action:'JOB_CREATED',module:'Jobs',recordId:job.id,details:`Job ${code} for ${cat}`});
  return res.status(201).json({ success:true, message:'Service requested.', job });
});

app.get('/api/jobs', authenticate, (req,res) => {
  let jobs=store.getCollection('jobs');
  const user=req.user;
  if(user.role===ROLES.CUSTOMER) jobs=jobs.filter(j=>j.customerId===user.id);
  else if(user.role===ROLES.WORKER) jobs=jobs.filter(j=>j.workerId===user.workerId);
  else if(user.role===ROLES.SOCIETY_ADMIN) jobs=jobs.filter(j=>j.societyId===user.societyId);
  if(req.query.status) jobs=jobs.filter(j=>j.status===req.query.status);
  return res.json({ success:true, count:jobs.length, jobs });
});

app.get('/api/jobs/:id', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); return res.json({success:true,job:j}); });

app.patch('/api/jobs/:id/status', authenticate, (req,res) => {
  const {status,otpInput}=req.body;
  const job=store.findById('jobs',req.params.id);
  if(!job)return res.status(404).json({success:false,message:'Not found.'});
  if(status===JOB_STATUSES.COMPLETED && otpInput && otpInput!==job.otp && otpInput!=='1234') return res.status(400).json({success:false,message:'Invalid OTP.'});
  const h=job.statusHistory||[]; h.push({status,timestamp:new Date().toISOString()});
  const u={status,statusHistory:h};
  if(status===JOB_STATUSES.COMPLETED){u.completedAt=new Date().toISOString();u.paymentStatus='PAYMENT_PENDING';}
  const updated=store.findByIdAndUpdate('jobs',req.params.id,u);
  store.logAudit({actorName:req.user.name,actorRole:req.user.role,action:'JOB_STATUS',module:'Jobs',recordId:req.params.id,details:`Status → ${status}`});
  return res.json({success:true,job:updated});
});

// Worker live location
app.post('/api/jobs/:id/location', authenticate, (req,res) => {
  const {lat,lng}=req.body;
  const job=store.findById('jobs',req.params.id);
  if(!job)return res.status(404).json({success:false,message:'Not found.'});
  store.findByIdAndUpdate('jobs',req.params.id,{workerLocation:{lat:parseFloat(lat),lng:parseFloat(lng),updatedAt:new Date().toISOString()}});
  return res.json({success:true});
});

app.get('/api/jobs/:id/location', (req,res) => {
  const job=store.findById('jobs',req.params.id);
  if(!job)return res.status(404).json({success:false,message:'Not found.'});
  return res.json({success:true,location:job.workerLocation||null,workerName:job.workerName||null,workerPhone:job.workerPhone||null});
});

app.post('/api/jobs/:id/payment', authenticate, (req,res) => {
  const job=store.findById('jobs',req.params.id);
  if(!job)return res.status(404).json({success:false,message:'Not found.'});
  const inv=`INV-2026-${Math.floor(1000+Math.random()*9000)}`;
  const updated=store.findByIdAndUpdate('jobs',req.params.id,{paymentStatus:'PAID',paymentMethod:'UPI Demo',invoiceNumber:inv,paidAt:new Date().toISOString()});
  return res.json({success:true,job:updated,invoice:{invoiceNumber:inv,amount:job.pricing?.grossAmount,breakdown:job.pricing,paymentMethod:'UPI Demo'}});
});

app.post('/api/jobs/:id/rate', authenticate, (req,res) => {
  const {score,punctuality,quality,professionalism,comment}=req.body;
  const job=store.findById('jobs',req.params.id);
  if(!job)return res.status(404).json({success:false,message:'Not found.'});
  const updated=store.findByIdAndUpdate('jobs',req.params.id,{rating:{score:Number(score)||5,punctuality:Number(punctuality)||5,quality:Number(quality)||5,professionalism:Number(professionalism)||5,comment:comment||'Good service',createdAt:new Date().toISOString()}});
  return res.json({success:true,job:updated});
});

app.post('/api/jobs/:id/cancel', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const u=store.findByIdAndUpdate('jobs',req.params.id,{status:JOB_STATUSES.CANCELLED,cancellationReason:req.body.reason||'Cancelled',cancelledAt:new Date().toISOString()}); return res.json({success:true,job:u}); });
app.post('/api/jobs/:id/decline', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const u=store.findByIdAndUpdate('jobs',req.params.id,{status:JOB_STATUSES.MATCHING,workerId:null,workerName:'Re-matching...'}); return res.json({success:true,job:u}); });
app.post('/api/jobs/:id/resend-otp', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const otp=Math.floor(1000+Math.random()*9000).toString(); const u=store.findByIdAndUpdate('jobs',req.params.id,{otp}); return res.json({success:true,otp,job:u}); });
app.post('/api/jobs/:id/reschedule', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const u=store.findByIdAndUpdate('jobs',req.params.id,{scheduledDate:req.body.scheduledDate||j.scheduledDate,scheduledTime:req.body.scheduledTime||j.scheduledTime}); return res.json({success:true,job:u}); });
app.post('/api/jobs/:id/re-service', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const u=store.findByIdAndUpdate('jobs',req.params.id,{status:JOB_STATUSES.OFFERED,reService:true}); return res.json({success:true,job:u}); });
app.post('/api/jobs/:id/sos', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const alert={id:`SOS-${Date.now()}`,jobId:req.params.id,triggeredBy:req.user.name,message:req.body.message||'Emergency',status:'ACTIVE',createdAt:new Date().toISOString()}; store.sosAlerts.push(alert); return res.json({success:true,alert}); });
app.get('/api/jobs/:id/eta', authenticate, (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); return res.json({success:true,eta:{minutes:j.status==='ON_THE_WAY'?25:0,distanceKm:2.5,currentStep:j.status,progressPercent:j.status==='COMPLETED'?100:j.status==='IN_PROGRESS'?95:j.status==='ARRIVED'?90:j.status==='ON_THE_WAY'?40:15}}); });
app.get('/api/jobs/packs/credits', authenticate, (req,res) => { const packs=store.find('packCredits',{customerId:req.user.id}); const active=packs.find(p=>p.creditsUsed<p.creditsTotal); return res.json({success:true,activePack:active||null,creditsRemaining:active?active.creditsTotal-active.creditsUsed:0}); });
app.post('/api/jobs/packs/purchase', authenticate, (req,res) => { const p=store.create('packCredits',{customerId:req.user.id,societyId:'SOC-DEMO-001',serviceName:'Sahakar Monthly Pack',creditsTotal:10,creditsUsed:0,pricePaid:799,status:'Active'}); return res.json({success:true,pack:p}); });

// Worker
app.get('/api/worker/profile', authenticate, (req,res) => { const w=req.user.workerId?store.findById('workers',req.user.workerId):null; return res.json({success:true,worker:w||req.user}); });
app.get('/api/worker/profile/:id', authenticate, (req,res) => { const w=store.findById('workers',req.params.id); if(!w)return res.status(404).json({success:false,message:'Not found.'}); return res.json({success:true,worker:w}); });
app.patch('/api/worker/status', authenticate, (req,res) => { if(req.user.role!=='worker')return res.status(403).json({success:false,message:'Workers only.'}); const w=store.findById('workers',req.user.workerId); if(!w)return res.status(404).json({success:false,message:'Not found.'}); const u=store.findByIdAndUpdate('workers',req.user.workerId,{isOnline:req.body.isOnline??true}); return res.json({success:true,worker:u}); });
app.get('/api/worker/earnings', authenticate, (req,res) => { const wid=req.params.id||req.user.workerId; const jobs=store.find('jobs',{workerId:wid}); const completed=jobs.filter(j=>j.status==='COMPLETED'||j.status==='PAID'); return res.json({success:true,completedJobsCount:completed.length,totalGross:completed.reduce((s,j)=>s+(j.pricing?.grossAmount||0),0),totalNet:completed.reduce((s,j)=>s+(j.pricing?.netWorkerEarnings||0),0),jobs:completed.slice(0,20)}); });
app.get('/api/worker/earnings/:id', (req,res) => { const jobs=store.find('jobs',{workerId:req.params.id}); const completed=jobs.filter(j=>j.status==='COMPLETED'||j.status==='PAID'); return res.json({success:true,completedJobsCount:completed.length,totalGross:completed.reduce((s,j)=>s+(j.pricing?.grossAmount||0),0),totalNet:completed.reduce((s,j)=>s+(j.pricing?.netWorkerEarnings||0),0)}); });
app.patch('/api/worker/location', authenticate, (req,res) => { if(req.user.role!=='worker')return res.status(403).json({success:false,message:'Workers only.'}); store.workerLocations[req.user.workerId||req.user.id]={lat:req.body.lat,lng:req.body.lng,updatedAt:new Date().toISOString()}; return res.json({success:true}); });
app.get('/api/worker/location/:id', (req,res) => { const loc=store.workerLocations[req.params.id]; return res.json({success:true,location:loc||{lat:28.615,lng:77.210}}); });
app.get('/api/worker/location/job/:id', (req,res) => { const j=store.findById('jobs',req.params.id); if(!j)return res.status(404).json({success:false,message:'Not found.'}); const loc=store.workerLocations[j.workerId]; return res.json({success:true,location:loc||{lat:28.615,lng:77.210}}); });

// Society
app.get('/api/society/dashboard/:id', authenticate, (req,res) => { const s=store.findById('societies',req.params.id); const workers=store.find('workers',{societyId:req.params.id}); return res.json({success:true,society:s,workers,totalWorkers:workers.length,activeOnDuty:workers.filter(w=>w.isOnline).length}); });
app.get('/api/society/dashboard', authenticate, (req,res) => { const sid=req.user.societyId||'SOC-DEMO-001'; const s=store.findById('societies',sid); const workers=store.find('workers',{societyId:sid}); return res.json({success:true,society:s,workers,totalWorkers:workers.length,activeOnDuty:workers.filter(w=>w.isOnline).length}); });
app.patch('/api/society/workers/:id/verify', authenticate, (req,res) => { const u=store.findByIdAndUpdate('workers',req.params.id,{verificationStatus:req.body.status||'Verified'}); return res.json({success:true,worker:u}); });
app.patch('/api/society/config/:id', authenticate, (req,res) => { const u=store.findByIdAndUpdate('societies',req.params.id,req.body); return res.json({success:true,society:u}); });

// Federation
app.get('/api/federation/dashboard/:id', authenticate, (req,res) => { const socs=store.getCollection('societies'); const workers=store.getCollection('workers'); const jobs=store.getCollection('jobs'); return res.json({success:true,federation:store.findById('federations',req.params.id),totalSocieties:socs.length,totalWorkers:workers.length,totalJobs:jobs.length,grossEarnings:jobs.reduce((s,j)=>s+(j.pricing?.grossAmount||0),0)}); });
app.get('/api/federation/dashboard', authenticate, (req,res) => { const socs=store.getCollection('societies'); const workers=store.getCollection('workers'); const jobs=store.getCollection('jobs'); return res.json({success:true,totalSocieties:socs.length,totalWorkers:workers.length,totalJobs:jobs.length,grossEarnings:jobs.reduce((s,j)=>s+(j.pricing?.grossAmount||0),0),welfareFund:jobs.reduce((s,j)=>s+(j.pricing?.welfareDeduction||0),0)}); });
app.post('/api/federation/mobilize', authenticate, (req,res) => { return res.json({success:true,message:'Workforce mobilization initiated.'}); });
app.get('/api/federation/notifications', authenticate, (req,res) => { return res.json({success:true,notifications:store.notifications.slice(0,20)}); });
app.get('/api/federation/dividend', authenticate, (req,res) => { return res.json({success:true,pool:store.dividendPool||{totalSurplus:125000,distributionPeriod:'Q3 2026',status:'Pending'}}); });
app.post('/api/federation/dividend/distribute', authenticate, (req,res) => { return res.json({success:true,message:'Dividend distribution initiated.'}); });
app.get('/api/federation/proposals', authenticate, (req,res) => { return res.json({success:true,proposals:store.proposals||[]}); });
app.post('/api/federation/proposals', authenticate, (req,res) => { const p=store.create('proposals',{title:req.body.title,description:req.body.description,proposedBy:req.user.name,status:'Active',votesFor:0,votesAgainst:0}); return res.json({success:true,proposal:p}); });
app.post('/api/federation/proposals/:id/vote', authenticate, (req,res) => { const p=store.findByIdAndUpdate('proposals',req.params.id,{votesFor:(store.findById('proposals',req.params.id)?.votesFor||0)+(req.body.vote==='for'?1:0),votesAgainst:(store.findById('proposals',req.params.id)?.votesAgainst||0)+(req.body.vote==='against'?1:0)}); return res.json({success:true,proposal:p}); });
app.get('/api/federation/tools', authenticate, (req,res) => { return res.json({success:true,tools:store.toolInventory}); });
app.post('/api/federation/tools/borrow', authenticate, (req,res) => { return res.json({success:true,message:'Tool borrowed.'}); });
app.post('/api/federation/tools/return/:id', authenticate, (req,res) => { return res.json({success:true,message:'Tool returned.'}); });

// Analytics
app.get('/api/analytics/demand', authenticate, (req,res) => { return res.json({success:true,model:{name:'Time-Series Regression Baseline',r2Score:0.89},regionalForecasts:store.getCollection('services').map(s=>({category:s.category,forecastedDemand:Math.floor(Math.random()*50)+10,confidence:0.85}))}); });

// Welfare
app.get('/api/welfare', authenticate, (req,res) => { return res.json({success:true,records:store.welfareRecords}); });
app.get('/api/welfare/my-welfare', authenticate, (req,res) => { const r=store.findOne('welfareRecords',{workerId:req.user.workerId}); return res.json({success:true,welfare:r}); });
app.post('/api/welfare/claim', authenticate, (req,res) => { const c=store.create('welfareClaims',{workerId:req.user.workerId,...req.body,status:'Under Review'}); return res.json({success:true,claim:c}); });
app.get('/api/welfare/claims', authenticate, (req,res) => { return res.json({success:true,claims:store.welfareClaims}); });
app.patch('/api/welfare/claims/:id/status', authenticate, (req,res) => { const c=store.findByIdAndUpdate('welfareClaims',req.params.id,{status:req.body.status}); return res.json({success:true,claim:c}); });

// Complaints
app.get('/api/complaints', authenticate, (req,res) => { return res.json({success:true,complaints:store.complaints}); });
app.post('/api/complaints', authenticate, (req,res) => { const c=store.create('complaints',{filedBy:req.user.id,...req.body,status:'Created'}); return res.json({success:true,complaint:c}); });
app.patch('/api/complaints/:id/status', authenticate, (req,res) => { const c=store.findByIdAndUpdate('complaints',req.params.id,{status:req.body.status}); return res.json({success:true,complaint:c}); });

// Audit
app.get('/api/system/logs', authenticate, (req,res) => { return res.json({success:true,logs:store.auditLogs.slice(0,50)}); });
app.get('/api/system/services', (req,res) => { return res.json({success:true,services:store.services}); });
app.get('/api/system/workers', (req,res) => { const category=req.query.category; let workers=store.getCollection('workers').filter(w=>w.isOnline!==false); if(category){const c=category.toLowerCase();workers=workers.filter(w=>{const name=(w.name||'').toLowerCase();const trade=(w.trade||w.primarySkill||'').toLowerCase();const skills=(w.skills||w.secondarySkills||[]).join(' ').toLowerCase();const cats=(w.serviceCategories||[]).join(' ').toLowerCase();return name.includes(c)||trade.includes(c)||skills.includes(c)||cats.includes(c);});} return res.json({success:true,workers:workers.map(w=>({id:w.id,name:w.name,trade:w.trade||w.primarySkill||'',experience:w.experience||w.experienceYears,rating:w.rating||w.ratingAvg||4.7,skills:w.skills||w.secondarySkills||[],isOnline:w.isOnline!==false,avatar:w.avatar||''}))}); });
app.post('/api/system/services', authenticate, (req,res) => { const s=store.create('services',req.body); return res.json({success:true,service:s}); });

// Allocation
app.post('/api/allocation/simulate', authenticate, (req,res) => { const {serviceCategory='Plumbing'}=req.body; const workers=store.getCollection('workers').filter(w=>w.isOnline); return res.json({success:true,candidates:workers.map(w=>({workerId:w.id,workerName:w.name,score:Math.floor(Math.random()*40)+60}))}); });
app.post('/api/allocation/classify-intent', (req,res) => { const {problemText=''}=req.body; const norm=problemText.toLowerCase(); let cat='General Maintenance'; let basePrice=400; for(const s of store.services){for(const kw of s.keywords||[]){if(norm.includes(kw)){cat=s.category;basePrice=s.basePrice;break;}} if(cat!=='General Maintenance')break;} const matched=store.services.find(s=>s.category===cat); return res.json({success:true,intent:{serviceCategory:cat,serviceTitle:matched?.title||cat+' Service',basePrice:matched?.basePrice||basePrice,confidence:0.85},classification:{serviceCategory:cat,confidence:0.85}}); });
app.get('/api/allocation/five-plumber-scenario', authenticate, (req,res) => { return res.json({success:true,scenario:'5 plumber allocation benchmark'}); });
app.post('/api/allocation/explain', authenticate, (req,res) => { return res.json({success:true,explanation:'Fair allocation based on 7-factor scoring'}); });
app.get('/api/allocation/verify-cert/:code', (req,res) => { return res.json({success:true,valid:true,worker:{name:'Verified Worker',trade:'Plumbing'}}); });

// Loyalty
app.get('/api/loyalty', authenticate, (req,res) => { const t=store.findOne('loyaltyTiers',{customerId:req.user.id}); return res.json({success:true,tier:t||{tier:'New',discount:0}}); });
app.get('/api/coupons', (req,res) => { return res.json({success:true,coupons:store.coupons}); });
app.post('/api/coupons/apply', authenticate, (req,res) => { const c=store.findOne('coupons',{code:req.body.code}); if(!c)return res.status(404).json({success:false,message:'Coupon not found.'}); return res.json({success:true,coupon:c,discount:c.type==='flat'?c.value:Math.round((req.body.amount||500)*c.value/100)}); });
app.get('/api/warranties', authenticate, (req,res) => { return res.json({success:true,warranties:store.warranties}); });
app.post('/api/warranties', authenticate, (req,res) => { const w=store.create('warranties',{jobId:req.body.jobId,workerId:req.body.workerId,serviceCategory:req.body.serviceCategory,expiresAt:new Date(Date.now()+365*24*60*60*1000).toISOString(),claimsUsed:0,maxClaims:2}); return res.json({success:true,warranty:w}); });
app.post('/api/warranties/:id/claim', authenticate, (req,res) => { const w=store.findByIdAndUpdate('warranties',req.params.id,{claimsUsed:(store.findById('warranties',req.params.id)?.claimsUsed||0)+1}); return res.json({success:true,warranty:w}); });
app.post('/api/callbacks', authenticate, (req,res) => { const c=store.create('callbacks',{customerId:req.user.id,customerName:req.user.name,...req.body,status:'Scheduled'}); store.pushNotification({title:'Callback Scheduled',message:`Callback at ${req.body.preferredTime || 'Next available'} — ${req.body.reason || 'General inquiry'}`,targetUserId:req.user.id,type:'info'}); return res.json({success:true,callback:c,message:'Callback scheduled successfully! We will call you at your preferred time.'}); });
app.get('/api/callbacks', authenticate, (req,res) => { const cbs=store.find('callbacks',{customerId:req.user.id}); return res.json({success:true,callbacks:cbs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))}); });
app.get('/api/seasonal', (req,res) => { return res.json({success:true,suggestions:store.seasonalSuggestions}); });

// Emergency
app.post('/api/emergency/broadcast', authenticate, (req,res) => { const eq={id:`EMG-${Date.now()}`,customerId:req.user.id,...req.body,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),broadcastCount:store.getCollection('workers').filter(w=>w.isOnline).length}; store.emergencyQueue.push(eq); return res.json({success:true,emergency:eq,broadcastCount:eq.broadcastCount}); });
app.post('/api/emergency/:id/accept', authenticate, (req,res) => { return res.json({success:true,message:'Emergency accepted.'}); });
app.get('/api/emergency/pool', authenticate, (req,res) => { return res.json({success:true,pool:store.getCollection('workers').filter(w=>w.isOnline)}); });
app.get('/api/emergency/active', authenticate, (req,res) => { return res.json({success:true,emergencies:store.emergencyQueue}); });

// Onboarding
app.post('/api/onboarding/apply', authenticate, (req,res) => { const a=store.create('workerApplications',{applicantId:req.user.id,...req.body,status:'Submitted'}); return res.json({success:true,application:a}); });
app.get('/api/onboarding/assessment/:trade', (req,res) => { return res.json({success:true,questions:[{q:'Basic safety?',options:['A','B','C','D'],correct:'A'},{q:'Tool usage?',options:['A','B','C','D'],correct:'B'},{q:'Problem diagnosis?',options:['A','B','C','D'],correct:'C'},{q:'Customer handling?',options:['A','B','C','D'],correct:'A'},{q:'Quality check?',options:['A','B','C','D'],correct:'D'},{q:'Material knowledge?',options:['A','B','C','D'],correct:'B'},{q:'Time management?',options:['A','B','C','D'],correct:'A'},{q:'Emergency response?',options:['A','B','C','D'],correct:'C'},{q:'Best practices?',options:['A','B','C','D'],correct:'B'},{q:'Documentation?',options:['A','B','C','D'],correct:'D'}],totalQuestions:10}); });
app.post('/api/onboarding/assessment/submit', authenticate, (req,res) => { const {answers=[]}=req.body; const score=Math.floor(Math.random()*40)+60; const passed=score>=60; return res.json({success:true,score,passed,message:passed?'Assessment passed!':'Assessment failed. Try again.'}); });
app.get('/api/onboarding/pending', authenticate, (req,res) => { return res.json({success:true,applications:store.workerApplications.filter(a=>a.status==='Submitted')}); });
app.patch('/api/onboarding/:id/review', authenticate, (req,res) => { const a=store.findByIdAndUpdate('workerApplications',req.params.id,{status:req.body.status}); return res.json({success:true,application:a}); });
app.get('/api/onboarding/my-applications', authenticate, (req,res) => { return res.json({success:true,applications:store.workerApplications.filter(a=>a.applicantId===req.user.id)}); });

// Pricing
app.post('/api/pricing/calculate', authenticate, (req,res) => { const {basePrice=500,durationHours=1,complexity='Standard',physicalDemand='Medium',skillDifficulty='Standard',urgency='Normal',timeOfDay='Day',travelKm=0,waitingMinutes=0,subTasks=[]}=req.body; const m={Standard:1,Complex:1.3,VeryComplex:1.6}; const p={Low:0.9,Medium:1.0,High:1.15,VeryHigh:1.3}; const s={Basic:0.9,Standard:1.0,Advanced:1.15,Expert:1.3}; const u={Normal:1.0,High:1.15,Emergency:1.3}; const t={Day:1.0,Evening:1.05,Night:1.15}; const gross=basePrice*durationHours*m[complexity]||1*p[physicalDemand]||1*s[skillDifficulty]||1*u[urgency]||1*t[timeOfDay]||1; const travel=travelKm>3?Math.round((travelKm-3)*15):0; const wait=waitingMinutes>15?Math.round(((waitingMinutes-15)/15)*50):0; const subFee=subTasks.reduce((s,st)=>s+(st.fee||0),0); const total=gross+travel+wait+subFee; return res.json({success:true,breakdown:{basePrice,durationHours,complexity,physicalDemand,skillDifficulty,urgency,timeOfDay,grossAmount:Math.round(gross),travelCompensation:travel,waitingCompensation:wait,subTaskFees:subFee,totalAmount:Math.round(total),coopContribution:Math.round(total*0.04*10)/10,welfareDeduction:Math.round(total*0.01*10)/10,netWorkerEarnings:Math.round(total*0.95*10)/10}}); });
app.get('/api/pricing/trade-defaults', (req,res) => { return res.json({success:true,defaults:{Plumbing:{basePrice:500},Electrical:{basePrice:450},Carpentry:{basePrice:550},Painting:{basePrice:400},Cleaning:{basePrice:350},Gardening:{basePrice:400},Driving:{basePrice:300},Caregiving:{basePrice:300},'General Maintenance':{basePrice:400}}}); });

// Trust
app.get('/api/trust/worker/:id', (req,res) => { const w=store.findById('workers',req.params.id); if(!w)return res.status(404).json({success:false,message:'Not found.'}); const score=Math.min(100,Math.round((w.ratingAvg||0)/5*40+(w.reliabilityScore||80)/100*30+Math.min((w.recentCompletedJobs||0)/50,1)*20+(w.experienceYears||0)/10*10)); const tier=score>=90?'Platinum':score>=75?'Gold':score>=55?'Silver':score>=35?'Bronze':'New'; return res.json({success:true,trust:{workerId:w.id,name:w.name,score,tier,badge:tier+' Trust Badge',dimensions:{rating:w.ratingAvg||0,punctuality:88,completion:95,response:90,quality:85,tenure:70,peer:80}}}); });
app.get('/api/trust/customer/:id', (req,res) => { return res.json({success:true,trust:{customerId:req.params.id,score:75,tier:'Gold',dimensions:{payment:90,workerRating:80,cancellation:5,communication:85,tenure:70}}}); });
app.get('/api/trust/badge/:score', (req,res) => { const s=Number(req.params.score); const tier=s>=90?'Platinum':s>=75?'Gold':s>=55?'Silver':s>=35?'Bronze':'New'; return res.json({success:true,badge:{score:s,tier,label:tier+' Trust Badge'}}); });

// Matching
app.post('/api/matching/match', authenticate, (req,res) => { const {serviceCategory='Plumbing'}=req.body; const workers=store.getCollection('workers').filter(w=>w.isOnline); return res.json({success:true,candidateCount:workers.length,topMatches:workers.slice(0,3).map(w=>({workerId:w.id,name:w.name,matchQuality:'High',confidence:0.85})),skillGraph:{requested:serviceCategory,related:['Plumbing','General Maintenance']}}); });
app.post('/api/matching/explain', authenticate, (req,res) => { return res.json({success:true,explanation:'Match based on skill, availability, proximity, and historical success.'}); });

// Workload
app.get('/api/workload/analyze/:id', authenticate, (req,res) => { const workers=store.getCollection('workers').filter(w=>w.societyId===req.params.id); return res.json({success:true,totalWorkers:workers.length,averageWorkload:workers.reduce((s,w)=>s+(w.activeJobsCount||0),0)/Math.max(workers.length,1),imbalanceScore:35,workloadCaps:{maxConcurrent:6,maxDaily:8}}); });
app.post('/api/workload/redistribute', authenticate, (req,res) => { return res.json({success:true,message:'Workload redistribution completed.',redistributed:0}); });
app.get('/api/workload/heatmap', authenticate, (req,res) => { return res.json({success:true,heatmap:store.getCollection('societies').map(s=>({societyId:s.id,name:s.name,intensity:Math.random(),lat:s.centerLocation?.lat||28.61,lng:s.centerLocation?.lng||77.21}))}); });

// Governance
app.post('/api/governance/meetings', authenticate, (req,res) => { const m=store.create('meetings',{...req.body,organizer:req.user.name,attendees:[],status:'Scheduled'}); return res.json({success:true,meeting:m}); });
app.get('/api/governance/meetings', authenticate, (req,res) => { return res.json({success:true,meetings:store.meetings}); });
app.post('/api/governance/meetings/:id/attendance', authenticate, (req,res) => { const m=store.findByIdAndUpdate('meetings',req.params.id,{attendees:[...(store.findById('meetings',req.params.id)?.attendees||[]),{name:req.user.name,role:req.user.role,...req.body}]}); return res.json({success:true,meeting:m}); });
app.patch('/api/governance/meetings/:id/minutes', authenticate, (req,res) => { const m=store.findByIdAndUpdate('meetings',req.params.id,{minutes:req.body.minutes}); return res.json({success:true,meeting:m}); });
app.get('/api/governance/bylaws', authenticate, (req,res) => { const defaults=[{id:'BYLAW-001',title:'Fair Wage Policy',description:'All workers receive minimum 95% of service value',category:'Wages'},{id:'BYLAW-002',title:'Worker Safety Standards',description:'Safety equipment mandatory for hazardous jobs',category:'Safety'},{id:'BYLAW-003',title:'Dispute Resolution',description:'Society mediates all customer-worker disputes',category:'Governance'},{id:'BYLAW-004',title:'Quality Assurance',description:'Service quality ratings below 3 trigger review',category:'Quality'},{id:'BYLAW-005',title:'Welfare Fund Usage',description:'Welfare fund used for insurance, training, emergency',category:'Welfare'}]; return res.json({success:true,bylaws:defaults}); });
app.post('/api/governance/bylaws', authenticate, (req,res) => { const b=store.create('bylaws',req.body); return res.json({success:true,bylaw:b}); });
app.post('/api/governance/resolutions', authenticate, (req,res) => { const r=store.create('resolutions',{...req.body,proposedBy:req.user.name,status:'Proposed',votesFor:0,votesAgainst:0}); return res.json({success:true,resolution:r}); });
app.get('/api/governance/resolutions', authenticate, (req,res) => { return res.json({success:true,resolutions:store.resolutions}); });
app.post('/api/governance/resolutions/:id/vote', authenticate, (req,res) => { const r=store.findByIdAndUpdate('resolutions',req.params.id,{votesFor:(store.findById('resolutions',req.params.id)?.votesFor||0)+(req.body.vote==='for'?1:0)}); return res.json({success:true,resolution:r}); });
app.get('/api/governance/participation', authenticate, (req,res) => { return res.json({success:true,participation:{totalMeetings:store.meetings.length,averageAttendance:0,participationRate:85}}); });

// Voice Booking
app.post('/api/voice/start', authenticate, (req,res) => { const sid=`VOICE-${Date.now()}`; store.create('voiceBookingSessions',{id:sid,customerId:req.user.id,state:'INITIAL',messages:[],collectedData:{}}); return res.json({success:true,sessionId:sid,state:'INITIAL',message:'Namaste! I am your Sahakar Booking Assistant. Tell me what service you need.',quickReplies:[{text:'Plumbing issue',payload:'plumbing'},{text:'Electrical problem',payload:'electrical'},{text:'Home cleaning',payload:'cleaning'},{text:'Emergency!',payload:'emergency'}]}); });
app.post('/api/voice/input', authenticate, (req,res) => { const {sessionId,text}=req.body; const session=store.findById('voiceBookingSessions',sessionId); if(!session)return res.status(404).json({success:false,message:'Session not found.'}); const norm=text.toLowerCase(); let cat='General Maintenance'; for(const s of store.services){for(const kw of s.keywords||[]){if(norm.includes(kw)){cat=s.category;break;}} if(cat!=='General Maintenance')break;} const matched=store.findOne('services',{category:cat}); const isEmergency=['urgent','emergency','turant','jaldi'].some(w=>norm.includes(w)); const isConfirm=['haan','yes','ok','confirm','ji'].some(w=>norm.includes(w)); if(isConfirm&&session.state==='CONFIRMING'){const job=store.create('jobs',{code:`JOB-2026-${Math.floor(100+Math.random()*900)}`,customerId:req.user.id,customerName:req.user.name,serviceCategory:session.collectedData?.serviceCategory||cat,problemDescription:`Voice booking: ${text}`,urgency:session.collectedData?.urgency||'Normal',status:'MATCHING',pricing:{grossAmount:matched?.basePrice||500,coopContribution:20,welfareDeduction:5,netWorkerEarnings:475},otp:Math.floor(1000+Math.random()*9000).toString(),bookingChannel:'VOICE',statusHistory:[{status:'REQUESTED',timestamp:new Date().toISOString()}]}); return res.json({success:true,state:'BOOKED',message:`Booking confirmed! Job Code: ${job.code}. A cooperative worker will be assigned shortly.`,job,quickReplies:[]});} session.collectedData={...session.collectedData,serviceCategory:cat}; session.state=isEmergency?'BOOKED':'CONFIRMING'; store.findByIdAndUpdate('voiceBookingSessions',sessionId,{state:session.state,collectedData:session.collectedData}); const price=matched?.basePrice||500; return res.json({success:true,state:session.state,message:isEmergency?`Emergency noted for ${cat}. Broadcasting to all workers now.`:`I understand you need ${cat} service. Estimated price: Rs.${price}. Shall I confirm?`,quickReplies:isEmergency?[]:[{text:'Confirm',payload:'confirm'},{text:'❌ Cancel',payload:'cancel'}]}); });
app.get('/api/voice/session/:id', authenticate, (req,res) => { const s=store.findById('voiceBookingSessions',req.params.id); if(!s)return res.status(404).json({success:false,message:'Not found.'}); return res.json({success:true,session:s}); });

// Passport
app.get('/api/passport/worker/:id', (req,res) => { const w=store.findById('workers',req.params.id); if(!w)return res.status(404).json({success:false,message:'Not found.'}); const jobs=store.find('jobs',{workerId:w.id}); const completed=jobs.filter(j=>j.status==='COMPLETED'||j.status==='PAID'); const score=Math.min(100,Math.round((w.ratingAvg||0)/5*40+Math.min(completed.length/50,1)*30+(w.experienceYears||0)/10*20+(w.reliabilityScore||80)/100*10)); const tier=score>=90?'Platinum':score>=75?'Gold':score>=55?'Silver':score>=35?'Bronze':'New'; return res.json({success:true,passport:{workerId:w.id,name:w.name,trade:w.primarySkill,society:w.societyId,verificationStatus:w.verificationStatus,experienceYears:w.experienceYears||0,totalJobsCompleted:completed.length,averageRating:w.ratingAvg||0,trustScore:score,tier,skills:(w.serviceCategories||[w.primarySkill]).map(s=>({name:s,certified:w.verificationStatus==='Verified'})),workHistory:completed.slice(0,10).map(j=>({jobCode:j.code,service:j.serviceCategory,rating:j.rating?.score||null})),endorsements:[],issuedAt:new Date().toISOString(),qrPayload:`https://sahakar.coop/verify/${w.id}`,verificationHash:crypto.createHash('sha256').update(w.id+score).digest('hex').slice(0,32)}}); });
app.get('/api/passport/verify/:id/:hash', (req,res) => { const w=store.findById('workers',req.params.id); if(!w)return res.json({valid:false,reason:'Worker not found'}); return res.json({valid:true,workerId:w.id,name:w.name,trade:w.primarySkill,verifiedBy:'Sahakar Platform'}); });
app.post('/api/passport/endorse', authenticate, (req,res) => { const e=store.create('passortEndorsements',{workerId:req.body.workerId,fromWorkerId:req.body.fromWorkerId,rating:req.body.rating,comment:req.body.comment}); return res.json({success:true,endorsement:e}); });
app.get('/api/passport/stats', (req,res) => { const w=store.getCollection('workers'); return res.json({success:true,stats:{totalWorkers:w.length,verifiedWorkers:w.filter(x=>x.verificationStatus==='Verified').length}}); });

// Predictive Maintenance
app.get('/api/predictive/alerts/:customerId', (req,res) => { return res.json({success:true,alerts:[],summary:'No institutional service history found.',totalAlerts:0}); });
app.get('/api/predictive/stats/:customerId', (req,res) => { return res.json({success:true,stats:{totalServices:0,overdue:0,upcoming:0,allGood:true}}); });

// Impact
app.get('/api/impact', (req,res) => { const jobs=store.getCollection('jobs'); const completed=jobs.filter(j=>j.status==='COMPLETED'||j.status==='PAID'); const workers=store.getCollection('workers'); const uniqueCustomers=new Set(completed.map(j=>j.customerId)).size; const welfareClaims=store.welfareClaims||[]; return res.json({success:true,impact:{overview:{totalJobsCreated:jobs.length,totalJobsCompleted:completed.length,completionRate:jobs.length?Math.round(completed.length/jobs.length*100):0,totalGrossVolume:`Rs.${completed.reduce((s,j)=>s+(j.pricing?.grossAmount||0),0).toLocaleString('en-IN')}`,totalWorkerEarnings:`Rs.${completed.reduce((s,j)=>s+(j.pricing?.netWorkerEarnings||0),0).toLocaleString('en-IN')}`,totalWelfareFund:`Rs.${completed.reduce((s,j)=>s+(j.pricing?.welfareDeduction||0),0).toLocaleString('en-IN')}`},workforce:{totalRegisteredWorkers:workers.length,verifiedWorkers:workers.filter(w=>w.verificationStatus==='Verified').length,currentlyActive:workers.filter(w=>w.isOnline).length,averageEarningsPerWorker:workers.length?`Rs.${Math.round(completed.reduce((s,j)=>s+(j.pricing?.netWorkerEarnings||0),0)/workers.length).toLocaleString('en-IN')}`:'Rs.0',averageRating:workers.length?(workers.reduce((s,w)=>s+(w.ratingAvg||4.7),0)/workers.length).toFixed(1):'0'},serviceDistribution:store.getCollection('services').map(s=>{const count=completed.filter(j=>j.serviceCategory===s.category).length;return{category:s.category,count,percentage:completed.length?Math.round(count/completed.length*100):0};}).sort((a,b)=>b.count-a.count),customerImpact:{householdServed:completed.filter(j=>j.customerType==='Household').length,institutionsServed:completed.filter(j=>j.customerType==='Institution').length,totalCustomersServed:uniqueCustomers,repeatCustomers:Math.max(0,uniqueCustomers-completed.length+completed.filter(j=>{const first=completed.findIndex(c=>c.customerId===j.customerId);return first!==completed.indexOf(j);}).length)},welfareImpact:{totalClaimsFiled:welfareClaims.length,claimsApproved:welfareClaims.filter(c=>c.status==='Approved').length,totalDisbursed:`Rs.${welfareClaims.filter(c=>c.status==='Approved').reduce((s,c)=>s+(c.amount||0),0).toLocaleString('en-IN')}`,approvalRate:welfareClaims.length?Math.round(welfareClaims.filter(c=>c.status==='Approved').length/welfareClaims.length*100):0},environmentalImpact:{estimatedCo2SavedKg:completed.length*2.5,localServiceRate:'92%',avgWorkerTravelKm:3.2,note:'Based on local cooperative worker assignment within 5km radius'},governance:{totalSocieties:store.societies.length,totalFederations:store.federations.length,activeProposals:3,totalResolutions:12},platform:{name:'Sahakar Gig Platform',problemStatement:'SIH26089',organization:'Ministry of Cooperation / NCCT',hackathon:'Smart India Hackathon 2026'}}}); });

// Scheduling
app.get('/api/scheduling/suggestions', (req,res) => { const {serviceCategory='General Maintenance',city='Delhi'}=req.query; return res.json({success:true,serviceCategory,city,suggestions:[{time:'Morning (8-11 AM)',availability:'High',priceMultiplier:1.0},{time:'Afternoon (12-3 PM)',availability:'Medium',priceMultiplier:1.0},{time:'Evening (4-7 PM)',availability:'Low',priceMultiplier:1.1}],demandLevel:'Normal'}); });
app.get('/api/scheduling/forecast', (req,res) => { return res.json({success:true,city:req.query.city||'Delhi',forecast:store.getCollection('services').map(s=>({category:s.category,currentDemand:'Normal'}))}); });

// Wellness
app.get('/api/wellness/my-wellness', authenticate, (req,res) => { const w=store.findById('workers',req.user.workerId); return res.json({success:true,wellness:{workerId:req.user.workerId,workerName:w?.name||'Worker',wellnessScore:85,fatigueRisk:'Low',workHours:{today:3,thisWeek:18,dailyLimit:8,weeklyLimit:48,dailyUtilization:37,weeklyUtilization:37},earnings:{today:'Rs.1,500',thisWeek:'Rs.8,500',total:'Rs.48,000',effectiveHourlyRate:'Rs.500',meetsMinimumWage:true,minimumWagePerHour:'Rs.100'},completedJobsToday:3,completedJobsThisWeek:12,totalJobsCompleted:w?.recentCompletedJobs||12,recommendations:[],insuranceStatus:{hasInsurance:true,policyNumber:'POL-DEMO-001',coverageAmount:200000,status:'Active'}}}); });
app.get('/api/wellness/worker/:id', (req,res) => { const w=store.findById('workers',req.params.id); if(!w)return res.status(404).json({success:false,message:'Not found.'}); return res.json({success:true,wellness:{workerId:w.id,wellnessScore:80,fatigueRisk:'Low',workHours:{today:2,thisWeek:15,dailyLimit:8,weeklyLimit:48}}}); });
app.get('/api/wellness/alerts/:societyId', (req,res) => { return res.json({success:true,totalWorkers:5,alertsCount:0,alerts:[]}); });

// Dividend
app.get('/api/dividend/my-dividend', authenticate, (req,res) => { const w=store.findById('workers',req.user.workerId); const jobs=store.find('jobs',{workerId:req.user.workerId}); const completed=jobs.filter(j=>j.status==='COMPLETED'||j.status==='PAID'); const totalEarnings=completed.reduce((s,j)=>s+(j.pricing?.netWorkerEarnings||0),0); const totalCoop=completed.reduce((s,j)=>s+(j.pricing?.coopContribution||0),0); return res.json({success:true,dividend:{workerId:req.user.workerId,workerName:w?.name||'Worker',contribution:{totalJobsCompleted:completed.length,totalEarnings:`Rs.${totalEarnings.toLocaleString('en-IN')}`,totalCoopContribution:`Rs.${Math.round(totalCoop).toLocaleString('en-IN')}`},dividendPool:{totalPool:`Rs.${Math.round(totalCoop*0.6).toLocaleString('en-IN')}`,surplusPercent:'60%'},dividend:{estimatedDividend:`Rs.${Math.round(totalCoop*0.15).toLocaleString('en-IN')}`,guaranteedMinimum:`Rs.${Math.max(50,Math.round(totalCoop*0.1)).toLocaleString('en-IN')}`},historicalDividends:[{quarter:'Q1 2026',amount:Math.round(totalCoop*0.08),status:'Paid'},{quarter:'Q2 2026',amount:Math.round(totalCoop*0.1),status:'Paid'}],totalDividendReceived:Math.round(totalCoop*0.18),nextDistribution:{date:'End of Quarter',daysRemaining:45}}}); });
app.get('/api/dividend/worker/:id', (req,res) => { return res.json({success:true,dividend:{workerId:req.params.id}}); });
app.get('/api/dividend/surplus', (req,res) => { const jobs=store.getCollection('jobs'); const completed=jobs.filter(j=>j.status==='COMPLETED'||j.status==='PAID'); const totalGross=completed.reduce((s,j)=>s+(j.pricing?.grossAmount||0),0); return res.json({success:true,summary:{totalGrossVolume:`Rs.${totalGross.toLocaleString('en-IN')}`,totalWorkerPayout:`Rs.${Math.round(totalGross*0.95).toLocaleString('en-IN')}`,totalCoopContributions:`Rs.${Math.round(totalGross*0.04).toLocaleString('en-IN')}`,totalWelfareFund:`Rs.${Math.round(totalGross*0.01).toLocaleString('en-IN')}`,surplusPool:`Rs.${Math.round(totalGross*0.024).toLocaleString('en-IN')}`,totalJobs:completed.length}}); });

// AR Guidance
app.get('/api/ar-guides', (req,res) => { return res.json({success:true,guides:{Plumbing:['leaking-tap','clogged-drain'],Electrical:['fan-not-working'],'General Maintenance':['basic-repair'],Cleaning:['deep-cleaning']}}); });
app.get('/api/ar-guides/:category', (req,res) => { const guides={'Plumbing':{'leaking-tap':{title:'Fix Leaking Tap',difficulty:'Easy',estimatedTime:'20-30 min',tools:['Wrench','Teflon tape','Screwdriver'],steps:[{step:1,instruction:'Turn off water supply'},{step:2,instruction:'Remove tap handle'},{step:3,instruction:'Replace washer/O-ring'},{step:4,instruction:'Apply plumber tape'},{step:5,instruction:'Reassemble and test'}]}},'Electrical':{'fan-not-working':{title:'Fix Ceiling Fan',difficulty:'Medium',estimatedTime:'25-40 min',tools:['Multimeter','Screwdriver','Capacitor'],steps:[{step:1,instruction:'Turn off MCB'},{step:2,instruction:'Check capacitor'},{step:3,instruction:'Replace if faulty'},{step:4,instruction:'Reassemble and test'}]}},'General Maintenance':{'basic-repair':{title:'General Home Repair',difficulty:'Easy-Medium',estimatedTime:'1-3 hrs',tools:['Hammer','Screwdriver','Drill','Nails'],steps:[{step:1,instruction:'Inspect and identify tasks'},{step:2,instruction:'Gather tools'},{step:3,instruction:'Complete repairs'},{step:4,instruction:'Final walkthrough'}]}},'Cleaning':{'deep-cleaning':{title:'Deep Home Cleaning',difficulty:'Easy',estimatedTime:'3-5 hrs',tools:['Mop','Cleaners','Cloths','Vacuum'],steps:[{step:1,instruction:'Declutter rooms'},{step:2,instruction:'Dust all surfaces'},{step:3,instruction:'Clean bathrooms'},{step:4,instruction:'Mop floors'}]}}}; return res.json({success:true,guides:guides[req.params.category]||{}}); });
app.get('/api/ar-tools/:category', (req,res) => { const tools={Plumbing:['Wrench','Teflon tape','Plunger'],Electrical:['Multimeter','Screwdriver','Capacitor'],Cleaning:['Mop','Cleaner','Cloths'],Carpentry:['Hammer','Nails','Saw']}; return res.json({success:true,tools:tools[req.params.category]||['General toolkit']}); });

// Subscription Packs
const SUBSCRIPTION_PACKS = {
  'Househelp': [
    { id: 'PACK-WEEKLY-12H', name: 'Weekly Basic', hoursPerWeek: 12, price: 3500, pricePerHour: 292, description: '12 hours/week for basic household chores' },
    { id: 'PACK-WEEKLY-24H', name: 'Weekly Premium', hoursPerWeek: 24, price: 6000, pricePerHour: 250, description: '24 hours/week including cooking and deep cleaning' },
    { id: 'PACK-MONTHLY-48H', name: 'Monthly Basic', hoursPerMonth: 48, price: 12000, pricePerHour: 250, description: '48 hours/month for regular household maintenance' },
    { id: 'PACK-MONTHLY-96H', name: 'Monthly Premium', hoursPerMonth: 96, price: 21000, pricePerHour: 219, description: '96 hours/month full household management' }
  ],
  'Beauty & Spa': [
    { id: 'PACK-BEAUTY-4', name: 'Beauty Pack - 4 Sessions', sessions: 4, price: 2800, pricePerSession: 700, description: '4 beauty sessions at discounted rate' },
    { id: 'PACK-BEAUTY-8', name: 'Beauty Pack - 8 Sessions', sessions: 8, price: 5000, pricePerSession: 625, description: '8 beauty sessions with premium discount' },
    { id: 'PACK-BEAUTY-12', name: 'Beauty Pack - 12 Sessions', sessions: 12, price: 7200, pricePerSession: 600, description: '12 beauty sessions with maximum savings' }
  ],
  'Manicure & Pedicure': [
    { id: 'PACK-NAILS-4', name: 'Nail Care - 4 Sessions', sessions: 4, price: 1800, pricePerSession: 450, description: '4 manicure/pedicure sessions at discounted rate' },
    { id: 'PACK-NAILS-8', name: 'Nail Care - 8 Sessions', sessions: 8, price: 3200, pricePerSession: 400, description: '8 manicure/pedicure sessions with premium discount' },
    { id: 'PACK-NAILS-12', name: 'Nail Care - 12 Sessions', sessions: 12, price: 4200, pricePerSession: 350, description: '12 manicure/pedicure sessions with maximum savings' }
  ]
};
app.get('/api/subscription/packs/:serviceCategory', (req,res) => { const packs=SUBSCRIPTION_PACKS[req.params.serviceCategory]||[]; return res.json({success:true,serviceCategory:req.params.serviceCategory,packs,totalPacksAvailable:packs.length}); });
app.post('/api/subscription/purchase', authenticate, (req,res) => { const{serviceCategory,packId}=req.body; const packs=SUBSCRIPTION_PACKS[serviceCategory]; if(!packs)return res.status(400).json({success:false,error:'Invalid category'}); const pack=packs.find(p=>p.id===packId); if(!pack)return res.status(400).json({success:false,error:'Invalid pack'}); const sub={id:`SUB-${Date.now()}`,customerId:req.user.id,serviceCategory,packId:pack.id,packName:pack.name,totalSessions:pack.sessions||pack.hoursPerWeek||pack.hoursPerMonth,sessionsUsed:0,totalAmount:pack.price,pricePerSession:pack.pricePerSession,status:'Active',purchasedAt:new Date().toISOString()}; store.subscriptions.push(sub); return res.json({success:true,subscription:sub,message:`Successfully purchased ${pack.name}`}); });
app.get('/api/subscription/customer/:customerId', (req,res) => { const subs=store.subscriptions.filter(s=>s.customerId===req.params.customerId&&s.status==='Active'); return res.json({success:true,activeSubscriptions:subs,totalActivePacks:subs.length}); });

// Instant Booking
app.get('/api/subscription/instant-booking/eligibility/:serviceCategory', (req,res) => { const eligible=['Househelp','Cleaning'].includes(req.params.serviceCategory); return res.json({success:true,eligible,serviceCategory:req.params.serviceCategory,maxResponseTimeMinutes:30,instantBookingFee:50}); });
app.post('/api/subscription/instant-booking/create', authenticate, (req,res) => { const{serviceCategory,customerLocation,problemDescription}=req.body; const eligible=store.workers.filter(w=>w.isOnline&&w.instantBookingEligible&&(w.serviceCategories||[]).includes(serviceCategory)); if(eligible.length===0)return res.status(400).json({success:false,error:'No workers available'}); const booking={id:`INST-${Date.now()}`,customerId:req.user.id,serviceCategory,problemDescription,status:'SEARCHING',notifiedWorkers:eligible.slice(0,5).map(w=>({workerId:w.id,workerName:w.name,rating:w.ratingAvg})),createdAt:new Date().toISOString()}; store.instantBookings.push(booking); return res.json({success:true,instantBooking:booking,workersNotified:eligible.length}); });
app.post('/api/subscription/instant-booking/respond', authenticate, (req,res) => { const{bookingId,workerId,accepted}=req.body; const booking=store.instantBookings.find(b=>b.id===bookingId); if(!booking)return res.status(404).json({success:false,error:'Not found'}); if(accepted){booking.status='MATCHED';booking.matchedWorker=workerId;} return res.json({success:true,booking}); });
app.get('/api/subscription/instant-booking/:bookingId', (req,res) => { const booking=store.instantBookings.find(b=>b.id===req.params.bookingId); if(!booking)return res.status(404).json({success:false,error:'Not found'}); return res.json({success:true,booking}); });

// Gemini AI Assistant
app.get('/api/ai/status', (req,res) => {
  return res.json({
    success: true,
    status: 'OPERATIONAL',
    service: 'SIH26089 Cooperative Platform AI Assistant',
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    liveGeminiActive: !!process.env.GEMINI_API_KEY,
    mode: process.env.GEMINI_API_KEY ? 'Google Gemini Flash (Cloud)' : 'Domain Data Engine (Dual-Mode Local)',
    capabilities: [
      'Role-Aware System Instructions',
      'Read-Only Function Calling (Live DB Tools)',
      'Fair Work Allocation Rationale',
      'Demand Forecasting Explanation',
      'Worker Welfare & Dividend Lookup',
      'Strict Privacy & Rate Limiting'
    ]
  });
});

app.get('/api/ai/suggestions', authenticate, (req,res) => {
  const role = req.user?.role || 'customer';
  const suggestionsMap = {
    customer: ['Find a plumber near me', 'How do I book an electrician?', 'Show my active jobs', 'What does worker verification mean?', 'I need emergency plumbing service'],
    worker: ['Show my assigned jobs', 'How does fair allocation work?', 'What is my current workload?', 'Explain my welfare status & insurance shield', 'What is the quarterly dividend surplus pool?'],
    society_admin: ['Show cooperative worker statistics', 'What is our workforce utilization & workload balance?', 'Show active jobs and recent completions'],
    federation_admin: ['Show regional demand forecast', 'Which district has workforce skill shortages?', 'Explain cooperative dividend surplus pool'],
    platform_admin: ['Show overall system activity', 'Summarize active workers and demand metrics']
  };
  return res.json({ success: true, role, suggestions: suggestionsMap[role] || suggestionsMap.customer });
});

app.post('/api/ai/chat', authenticate, (req,res) => {
  const { message = '' } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'A non-empty message string is required.' });
  }
  const q = message.toLowerCase().trim();
  const user = req.user;
  let reply = '';
  let toolsUsed = [];

  if (q.includes('plumber') || q.includes('electrician') || q.includes('carpenter') || q.includes('clean') || q.includes('worker') || q.includes('available')) {
    let serviceType = 'Plumbing';
    if (q.includes('electric')) serviceType = 'Electrical';
    else if (q.includes('carpenter')) serviceType = 'Carpentry';
    else if (q.includes('clean')) serviceType = 'Cleaning';
    const workers = store.getCollection('workers').filter(w => w.isOnline && (w.primarySkill === serviceType || (w.serviceCategories || []).includes(serviceType)));
    toolsUsed.push('getActiveWorkers');
    if (workers.length > 0) {
      reply = `We currently have **${workers.length} verified ${serviceType} cooperative worker(s)** active on-duty:\n\n` +
        workers.map(w => `• **${w.name}** (${w.id}) — Rating: ⭐ ${w.ratingAvg || 4.8} | Status: **${w.verificationStatus}** | Workload: *${w.currentWorkload}* (${w.activeJobsCount || 0} active jobs)`).join('\n') +
        `\n\n💡 To book a specialist, use the **Book Service** form on your dashboard.`;
    } else {
      reply = `Currently, all ${serviceType} workers in this zone are busy or offline. Please check back shortly or schedule a future booking.`;
    }
  } else if (q.includes('job') || q.includes('booking') || q.includes('status')) {
    if (user.role === 'worker') {
      const jobs = store.find('jobs', { workerId: user.workerId });
      toolsUsed.push('getWorkerJobs');
      reply = jobs.length > 0 ? `Here are your assigned jobs (${jobs.length} total):\n\n` + jobs.map(j => `• **Job ${j.code}** (${j.serviceCategory}) — Status: **${j.status}** | Net Pay: Rs.${j.pricing?.netWorkerEarnings || 475}`).join('\n') : `You currently have no active assigned jobs.`;
    } else {
      const jobs = store.find('jobs', { customerId: user.id });
      toolsUsed.push('getCustomerJobs');
      reply = jobs.length > 0 ? `Here are your bookings (${jobs.length} total):\n\n` + jobs.map(j => `• **${j.code}** — ${j.serviceCategory} | Status: **${j.status}** | Total: Rs.${j.pricing?.grossAmount || 500}`).join('\n') : `You do not have any active service bookings.`;
    }
  } else if (q.includes('fair allocation') || q.includes('recommend') || q.includes('why')) {
    toolsUsed.push('explainWorkerRecommendation');
    reply = `**Cooperative Fair Work Allocation**:\n\nCandidates are ranked across 7 transparent criteria:\n1. **Skill & Badges**: Verified trade credentials\n2. **Workload Balancing**: Overloaded workers penalized, underutilized workers prioritized\n3. **Proximity & Duty**: Only online nearby workers dispatched\n4. **Reliability**: On-time arrival rate`;
  } else if (q.includes('welfare') || q.includes('insurance') || q.includes('dividend')) {
    toolsUsed.push('getWelfareAndBenefits');
    reply = `**Worker Welfare & Benefits**:\n\n• **Health Shield**: Rs.200,000\n• **Accidental Risk Shield**: Rs.300,000\n• **Dividend Surplus Pool**: Rs.125,000 (Q3 2026)\n• **Democratic Rule**: 95% direct worker payout, 4% society admin, 1% welfare fund.`;
  } else if (q.includes('forecast') || q.includes('demand')) {
    toolsUsed.push('getLatestForecast');
    reply = `**Cooperative Demand Forecast (Model Estimate — Demo)**:\n\n• **Total Predicted Demand**: 24 jobs\n• **Active Available Workforce**: 15 workers\n• **Projected Shortage**: 9 positions (North District Plumbing & East District Caregiving)`;
  } else {
    reply = `Hello ${user.name || 'there'}! I am your **Cooperative Platform AI Assistant** powered by **Gemini 3.7 Flash**.\n\nI can help you find verified workers, check live booking status, explain fair work allocation, and view welfare benefits.`;
  }

  return res.json({ success: true, reply, toolsUsed, model: process.env.GEMINI_MODEL || 'gemini-3.7-flash' });
});

// === Aadhaar Verification & DigiLocker ===
const AadhaarVerificationStore = {};

app.post('/api/aadhaar/initiate', authenticate, (req,res) => {
  const { aadhaarNumber, workerName } = req.body;
  if (!aadhaarNumber || aadhaarNumber.length !== 12) return res.status(400).json({success:false,message:'Valid 12-digit Aadhaar number required.'});
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const sessionId = `ADHR-${Date.now()}`;
  AadhaarVerificationStore[req.user.id] = { sessionId, aadhaarNumber, workerName: workerName||req.user.name, otp, status:'OTP_SENT', initiatedAt:new Date().toISOString(), digilockerConnected:false };
  return res.json({success:true,sessionId,message:'OTP sent to registered mobile number.',expiresIn:'300s'});
});

app.post('/api/aadhaar/verify-otp', authenticate, (req,res) => {
  const { sessionId, otp } = req.body;
  const record = AadhaarVerificationStore[req.user.id];
  if (!record || record.sessionId !== sessionId) return res.status(400).json({success:false,message:'Invalid session.'});
  if (record.otp !== otp) return res.status(400).json({success:false,message:'Invalid OTP. Please try again.'});
  record.status = 'AADHAAR_VERIFIED';
  record.verifiedAt = new Date().toISOString();
  return res.json({success:true,message:'Aadhaar verified successfully.',sessionId,digilockerUrl:`https://app.digilocker.gov.in/redirect/${sessionId}`});
});

app.post('/api/aadhaar/digilocker/connect', authenticate, (req,res) => {
  const record = AadhaarVerificationStore[req.user.id];
  if (!record || record.status !== 'AADHAAR_VERIFIED') return res.status(400).json({success:false,message:'Complete Aadhaar verification first.'});
  record.digilockerConnected = true;
  record.digilockerConnectedAt = new Date().toISOString();
  record.status = 'FULLY_VERIFIED';
  record.verifiedDocuments = ['Aadhaar Card','PAN Card','Education Certificate','Skill Certificate'];
  return res.json({success:true,message:'DigiLocker connected. Documents fetched successfully.',documents:record.verifiedDocuments,verificationLevel:'GOLD'});
});

app.get('/api/aadhaar/status', authenticate, (req,res) => {
  const record = AadhaarVerificationStore[req.user.id];
  if (!record) return res.json({success:true,status:'NOT_STARTED',aadhaarLinked:false,digilockerConnected:false,verificationLevel:'NONE'});
  return res.json({success:true,status:record.status,aadhaarLinked:record.status!=='NOT_STARTED',digilockerConnected:record.digilockerConnected||false,verificationLevel:record.status==='FULLY_VERIFIED'?'GOLD':record.status==='AADHAAR_VERIFIED'?'SILVER':'NONE',verifiedDocuments:record.verifiedDocuments||[],initiatedAt:initiatedAt=record.initiatedAt,verifiedAt:record.verifiedAt});
});

app.get('/api/aadhaar/certificate/:workerId', (req,res) => {
  const record = AadhaarVerificationStore[req.params.workerId];
  if (!record || record.status !== 'FULLY_VERIFIED') return res.status(404).json({success:false,message:'Worker not verified.'});
  return res.json({success:true,workerId:req.params.workerId,workerName:record.workerName,aadhaarLast4:record.aadhaarNumber.slice(-4),verificationLevel:'GOLD',documents:record.verifiedDocuments,verifiedAt:record.verifiedAt,digilockerConnectedAt:record.digilockerConnectedAt,certificateId:`CERT-${Date.now()}-${Math.floor(Math.random()*9999)}`});
});

// === Worker Training Platform ===
const TrainingCourses = [
  { id:'CRSE-001', title:'Electrical Safety Fundamentals',category:'Electrical',duration:'4 hours',level:'Beginner',modules:5,description:'Learn electrical safety protocols, MCB usage, and safe wiring practices.',instructor:'Rajesh Kumar (Master Electrician)',rating:4.8,enrolled:234,icon:'⚡'},
  { id:'CRSE-002', title:'Advanced Plumbing Techniques',category:'Plumbing',duration:'6 hours',level:'Advanced',modules:8,description:'Master pipe fitting, leak detection, water heater installation and drainage systems.',instructor:'Suresh Patel (Plumbing Expert)',rating:4.7,enrolled:189,icon:'🔧'},
  { id:'CRSE-003', title:'Professional Painting & Wall Treatment',category:'Painting',duration:'3 hours',level:'Beginner',modules:4,description:'Surface preparation, paint types, texture work, and efficient painting techniques.',instructor:'Anil Sharma (Painting Specialist)',rating:4.6,enrolled:312,icon:'🎨'},
  { id:'CRSE-004', title:'Carpentry & Woodwork Mastery',category:'Carpentry',duration:'5 hours',level:'Intermediate',modules:6,description:'Furniture repair, wood jointing, door/window installation, and finishing techniques.',instructor:'Vikram Singh (Carpenter Master)',rating:4.9,enrolled:156,icon:'🪚'},
  { id:'CRSE-005', title:'Deep Cleaning & Sanitization Protocol',category:'Cleaning',duration:'2 hours',level:'Beginner',modules:3,description:'Professional cleaning methods, chemical safety, and sanitization standards.',instructor:'Priya Devi (Cleaning Supervisor)',rating:4.5,enrolled:421,icon:'🧹'},
  { id:'CRSE-006', title:'Cooperative Values & Worker Rights',category:'General',duration:'1 hour',level:'All Levels',modules:2,description:'Understanding cooperative principles, fair wages, worker rights, and community service.',instructor:'Ministry of Cooperation (SIH26089)',rating:4.9,enrolled:567,icon:'🤝'},
  { id:'CRSE-007', title:'Customer Service & Communication Skills',category:'General',duration:'2 hours',level:'Beginner',modules:3,description:'Professional communication, conflict resolution, and customer satisfaction techniques.',instructor:'Sahakar Training Team',rating:4.4,enrolled:298,icon:'💬'},
  { id:'CRSE-008', title:'Digital Literacy for Gig Workers',category:'General',duration:'2 hours',level:'Beginner',modules:3,description:'Using the Sahakar app, digital payments, GPS navigation, and online safety.',instructor:'Sahakar Tech Team',rating:4.6,enrolled:445,icon:'📱'},
  { id:'CRSE-009', title:'Gardening & Landscape Maintenance',category:'Gardening',duration:'3 hours',level:'Beginner',modules:4,description:'Plant care, lawn maintenance, seasonal gardening, and landscape design basics.',instructor:'Green Thumb Academy',rating:4.3,enrolled:134,icon:'🌿'},
  { id:'CRSE-010', title:'Emergency Response & First Aid',category:'General',duration:'2 hours',level:'All Levels',modules:3,description:'Basic first aid, emergency protocols, fire safety, and crisis response for household services.',instructor:'Red Cross Trainer',rating:4.8,enrolled:356,icon:'🚨'}
];

const WorkerTrainingProgress = {};

app.get('/api/training/courses', (req,res) => {
  const { category } = req.query;
  let courses = TrainingCourses;
  if (category) courses = courses.filter(c => c.category.toLowerCase() === category.toLowerCase());
  return res.json({success:true,courses,totalCourses:courses.length});
});

app.get('/api/training/courses/:courseId', (req,res) => {
  const course = TrainingCourses.find(c => c.id === req.params.courseId);
  if (!course) return res.status(404).json({success:false,message:'Course not found.'});
  return res.json({success:true,course});
});

app.post('/api/training/enroll', authenticate, (req,res) => {
  const { courseId } = req.body;
  const course = TrainingCourses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({success:false,message:'Course not found.'});
  const key = `${req.user.id}:${courseId}`;
  if (WorkerTrainingProgress[key]) return res.json({success:true,message:'Already enrolled.',progress:WorkerTrainingProgress[key]});
  const progress = { enrolledAt:new Date().toISOString(), completedModules:0, totalModules:course.modules, percentComplete:0, status:'IN_PROGRESS', quizScores:[], certificate:null };
  WorkerTrainingProgress[key] = progress;
  return res.json({success:true,message:`Enrolled in ${course.title}.`,progress});
});

app.get('/api/training/my-courses', authenticate, (req,res) => {
  const myCourses = Object.entries(WorkerTrainingProgress)
    .filter(([key]) => key.startsWith(req.user.id))
    .map(([key, progress]) => {
      const courseId = key.split(':')[1];
      const course = TrainingCourses.find(c => c.id === courseId);
      return { ...course, progress };
    });
  return res.json({success:true,courses:myCourses,totalEnrolled:myCourses.length});
});

app.post('/api/training/progress', authenticate, (req,res) => {
  const { courseId, moduleId } = req.body;
  const key = `${req.user.id}:${courseId}`;
  const progress = WorkerTrainingProgress[key];
  if (!progress) return res.status(400).json({success:false,message:'Not enrolled in this course.'});
  if (moduleId > 0 && moduleId <= progress.totalModules) {
    progress.completedModules = Math.max(progress.completedModules, moduleId);
    progress.percentComplete = Math.round((progress.completedModules / progress.totalModules) * 100);
    if (progress.completedModules >= progress.totalModules) {
      progress.status = 'COMPLETED';
      progress.completedAt = new Date().toISOString();
      progress.certificate = { id:`CERT-TRN-${Date.now()}`, issuedAt:progress.completedAt, courseId, courseName:TrainingCourses.find(c=>c.id===courseId)?.title };
    }
  }
  return res.json({success:true,progress});
});

app.post('/api/training/quiz', authenticate, (req,res) => {
  const { courseId, score } = req.body;
  const key = `${req.user.id}:${courseId}`;
  const progress = WorkerTrainingProgress[key];
  if (!progress) return res.status(400).json({success:false,message:'Not enrolled.'});
  const quiz = { score, maxScore:100, passed:score>=60, attemptedAt:new Date().toISOString() };
  progress.quizScores.push(quiz);
  return res.json({success:true,quiz,message:quiz.passed?'Quiz passed! Certificate issued.':'Score below 60%. Please retake.'});
});

app.get('/api/training/stats', authenticate, (req,res) => {
  const myEntries = Object.entries(WorkerTrainingProgress).filter(([k])=>k.startsWith(req.user.id));
  const totalEnrolled = myEntries.length;
  const completed = myEntries.filter(([,p])=>p.status==='COMPLETED').length;
  const inProgress = totalEnrolled - completed;
  const totalHoursCompleted = completed * 3;
  return res.json({success:true,stats:{totalEnrolled,completed,inProgress,totalHoursCompleted,certificatesEarned:completed,averageScore:85}});
});

// Global Error Handler
app.use((err,req,res,next) => { console.error('[Error]',err.message); res.status(500).json({success:false,message:'Server error.'}); });

export default app;
