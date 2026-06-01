/**
 * Core Application Logic for Repair & Todo Tracking System - Hybrid Local-Cloud Edition
 * Features: Auto Cloudflare D1 API / LocalStorage DB switcher, File to Base64 encoder, HTML5 Drag-and-Drop, Role switching, JSON Import/Export
 * Created: 2026-06-01
 */

// Global Application State
const STATE = {
  currentUser: {
    username: 'somchai',
    fullname: 'สมชาย ใจดี',
    department: 'ฝ่ายขาย (Sales)',
    phone: '081-234-5678',
    role: 'user' // 'user' or 'admin'
  },
  tasks: [],
  activeFilter: 'All',
  isCloudMode: false // Automatically determined below
};

// Preset Users for Simulation Role Switcher
const PRESET_USERS = [
  { username: 'somchai', fullname: 'สมชาย ใจดี', department: 'ฝ่ายขาย (Sales)', phone: '081-234-5678', role: 'user' },
  { username: 'wipa', fullname: 'วิภา หอมขจร', department: 'บัญชี (Account)', phone: '082-345-6789', role: 'user' },
  { username: 'kitti', fullname: 'กิตติ รักเรียน', department: 'ฝ่ายบุคคล (HR)', phone: '083-456-7890', role: 'user' },
  { username: 'admin_boy', fullname: 'แอดมินบอย (System Admin)', department: 'ไอที (IT Support)', phone: '089-999-9999', role: 'admin' }
];

// Default Mock Data for local fallback
const MOCK_TASKS = [
  {
    id: 'REQ-1001',
    username: 'somchai',
    fullname: 'สมชาย ใจดี',
    department: 'ฝ่ายขาย (Sales)',
    phone: '081-234-5678',
    repair_type: 'คอมพิวเตอร์ / ฮาร์ดแวร์',
    description: 'หน้าจอคอมพิวเตอร์เปิดไม่ติด ไฟสีส้มกระพริบ แต่เครื่องเสียงดังมีพัดลมหมุน ลองสลับสายหน้าจอกับเพื่อนแล้วไม่หาย รบกวนช่วยเหลือด่วนครับ ต้องเตรียมเสนอราคาให้ลูกค้าบ่ายนี้',
    reported_date: '2026-06-01',
    day_str: 'จันทร์',
    image_file: null,
    attached_file: null,
    status: 'Pending',
    admin_name: '',
    admin_remark: '',
    admin_upload_file: null
  },
  {
    id: 'REQ-1002',
    username: 'wipa',
    fullname: 'วิภา หอมขจร',
    department: 'บัญชี (Account)',
    phone: '082-345-6789',
    repair_type: 'ระบบเน็ตเวิร์ก / อินเทอร์เน็ต',
    description: 'เครื่องพิมพ์ห้องบัญชีพิมพ์งานช้ามาก และบางครั้งอินเทอร์เน็ตหลุดบ่อย ขึ้นเครื่องหมายตกใจสีเหลืองที่มุมขวา ทำให้ไม่สามารถดึงข้อมูลภาษีออนไลน์ได้ค่ะ',
    reported_date: '2026-05-31',
    day_str: 'อาทิตย์',
    image_file: null,
    attached_file: null,
    status: 'In_Progress',
    admin_name: 'แอดมินบอย',
    admin_remark: 'ตรวจสอบสัญญาณ LAN ที่พอร์ตผนังพบว่าหัวต่อสาย LAN หลวม ได้เข้าทำการย้ำหัว LAN ใหม่แล้ว ขณะนี้สัญญาณอินเทอร์เน็ตปกติ กำลังตรวจสอบไดรเวอร์เครื่องพิมพ์ห้องบัญชีต่อครับ',
    admin_upload_file: null
  },
  {
    id: 'REQ-1003',
    username: 'kitti',
    fullname: 'กิตติ รักเรียน',
    department: 'ฝ่ายบุคคล (HR)',
    phone: '083-456-7890',
    repair_type: 'โปรแกรมคอมพิวเตอร์ / ซอฟต์แวร์',
    description: 'ไม่สามารถเปิดโปรแกรมคำนวณเงินเดือนพนักงาน (Payroll Pro) ได้ ขึ้นแจ้งเตือน Error Code: 0x80070002 ข้อมูลฐานข้อมูลไม่ตรงกัน รบกวนรีเซ็ตหรือช่วยแก้ไขให้ด้วยครับ',
    reported_date: '2026-05-29',
    day_str: 'ศุกร์',
    image_file: null,
    attached_file: null,
    status: 'Completed',
    admin_name: 'แอดมินบอย',
    admin_remark: 'แก้ไขปัญหา Error Code ในโปรแกรม Payroll สำเร็จ โดยทำการเชื่อมต่อเส้นทางของ IP Database Server ใหม่ในเมนู Config และอัปเดตเวอร์ชันโปรแกรมล่าสุดให้เรียบร้อยแล้ว ทดสอบเปิดใช้งานร่วมกับเจ้าหน้าที่ HR ทำงานได้ปกติ 100%',
    admin_upload_file: { name: 'payroll_patch_note.pdf', data: 'data:text/plain;base64,UGF0Y2ggTm90ZXM6IERhdGFiYXNlIGNvbm5lY3Rpb24gcGF0aCBmaXhlZC4=' }
  }
];

// Helper: Convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, data: reader.result });
    reader.onerror = error => reject(error);
  });
}

// Helper: Format Date
function getThaiDayName(dateString) {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const date = new Date(dateString);
  return days[date.getDay()] || 'ไม่ระบุ';
}

// Database Layer - Handles both Cloud D1 Database API and LocalStorage fallback
const DB = {
  async init() {
    // Auto-detect environments
    const isCloudHost = window.location.hostname.includes('.pages.dev') || 
                        (window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1' && 
                         window.location.protocol !== 'file:');
    
    STATE.isCloudMode = isCloudHost;
    
    if (STATE.isCloudMode) {
      console.log('☁️ Cloud Mode active. Fetching data from Cloudflare D1 SQLite database...');
      await this.syncFromCloud();
    } else {
      console.log('💾 Local Mode active. Using localStorage database simulation...');
      const stored = localStorage.getItem('repair_tasks');
      if (!stored) {
        localStorage.setItem('repair_tasks', JSON.stringify(MOCK_TASKS));
        STATE.tasks = [...MOCK_TASKS];
      } else {
        try {
          STATE.tasks = JSON.parse(stored);
        } catch (e) {
          STATE.tasks = [...MOCK_TASKS];
          localStorage.setItem('repair_tasks', JSON.stringify(MOCK_TASKS));
        }
      }
    }
  },

  async syncFromCloud() {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        STATE.tasks = await response.json();
      } else {
        console.error('Failed to sync from D1 database. Status: ' + response.status);
        // Fallback to local storage if API is broken
        STATE.isCloudMode = false;
        await this.init();
      }
    } catch (err) {
      console.error('API Error: ' + err.message + '. Falling back to localStorage...');
      STATE.isCloudMode = false;
      await this.init();
    }
  },
  
  saveLocalOnly() {
    if (!STATE.isCloudMode) {
      localStorage.setItem('repair_tasks', JSON.stringify(STATE.tasks));
    }
  },
  
  async getAll() {
    if (STATE.isCloudMode) {
      await this.syncFromCloud();
    }
    return STATE.tasks;
  },
  
  async getByUser(username) {
    if (STATE.isCloudMode) {
      try {
        const response = await fetch(`/api/tasks?username=${encodeURIComponent(username)}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.error('Failed to fetch user tasks from cloud API: ' + err.message);
      }
    }
    return STATE.tasks.filter(t => t.username === username);
  },
  
  async getById(id) {
    if (STATE.isCloudMode) {
      await this.syncFromCloud();
    }
    return STATE.tasks.find(t => t.id === id);
  },
  
  async create(task) {
    if (STATE.isCloudMode) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        });
        if (response.ok) {
          await this.syncFromCloud();
          return task;
        } else {
          throw new Error('D1 database insert failed: ' + response.statusText);
        }
      } catch (err) {
        console.error('Cloud creation error: ' + err.message + '. Saving locally as backup.');
        alert('เชื่อมต่อคลาวด์ขัดข้อง ระบบบันทึกข้อมูลไว้ในคอมพิวเตอร์ของคุณชั่วคราว');
      }
    }
    
    // Local fallback
    STATE.tasks.unshift(task);
    this.saveLocalOnly();
    return task;
  },
  
  async update(id, updatedFields) {
    if (STATE.isCloudMode) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updatedFields })
        });
        if (response.ok) {
          await this.syncFromCloud();
          return STATE.tasks.find(t => t.id === id);
        } else {
          throw new Error('D1 database update failed: ' + response.statusText);
        }
      } catch (err) {
        console.error('Cloud update error: ' + err.message + '. Updating locally.');
      }
    }

    // Local fallback
    const idx = STATE.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      STATE.tasks[idx] = { ...STATE.tasks[idx], ...updatedFields };
      this.saveLocalOnly();
      return STATE.tasks[idx];
    }
    return null;
  },
  
  async import(tasksArray) {
    if (Array.isArray(tasksArray)) {
      if (STATE.isCloudMode) {
        // For cloud import, we'll recreate them one by one in the D1 DB
        for (const task of tasksArray) {
          await this.create(task);
        }
        return true;
      } else {
        STATE.tasks = tasksArray;
        this.saveLocalOnly();
        return true;
      }
    }
    return false;
  }
};

// DOM Events & Renderer controller
const UI = {
  async init() {
    this.cacheElements();
    this.bindEvents();
    this.initRoleSwitcher();
    await this.switchRole(STATE.currentUser.username);
  },

  cacheElements() {
    this.roleSelector = document.getElementById('roleSelect');
    this.navBrandLogo = document.getElementById('navBrandLogo');
    this.navRoleName = document.getElementById('navRoleName');
    this.navRoleSub = document.getElementById('navRoleSub');
    this.userBadgeAvatar = document.getElementById('userBadgeAvatar');
    this.userBadgeName = document.getElementById('userBadgeName');
    this.userBadgeRole = document.getElementById('userBadgeRole');
    
    // Panels
    this.adminDashboard = document.getElementById('adminDashboard');
    this.userDashboard = document.getElementById('userDashboard');
    
    // Admin Panels
    this.kanbanBoard = document.getElementById('kanbanBoard');
    this.adminSearchInput = document.getElementById('adminSearchInput');
    
    // Summary Cards (Admin & User)
    this.sumTotal = document.getElementById('sumTotal');
    this.sumPending = document.getElementById('sumPending');
    this.sumProgress = document.getElementById('sumProgress');
    this.sumCompleted = document.getElementById('sumCompleted');
    
    // User Panel elements
    this.userForm = document.getElementById('userRequestForm');
    this.userTasksContainer = document.getElementById('userTaskCards');
    this.userWelcomeName = document.getElementById('userWelcomeName');
    this.userTaskFilterTabs = document.querySelectorAll('.tab-btn');
    
    // Custom Inputs
    this.repairTypeSelect = document.getElementById('repairTypeSelect');
    this.otherRepairGroup = document.getElementById('otherRepairGroup');
    this.otherRepairInput = document.getElementById('otherRepairInput');
    
    // Form fields prefill
    this.formFullname = document.getElementById('fullname');
    this.formDepartment = document.getElementById('department');
    this.formPhone = document.getElementById('phone');
    
    // Drag & Drop Uploader (User Form)
    this.userImageUpload = document.getElementById('imageUpload');
    this.userImageName = document.getElementById('imageName');
    this.userImagePreview = document.getElementById('imagePreview');
    this.userAttachUpload = document.getElementById('attachUpload');
    this.userAttachName = document.getElementById('attachName');

    // Admin Modal Elements
    this.modalOverlay = document.getElementById('adminModal');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.modalTaskId = document.getElementById('modalTaskId');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalUsername = document.getElementById('modalUsername');
    this.modalFullname = document.getElementById('modalFullname');
    this.modalDept = document.getElementById('modalDept');
    this.modalPhone = document.getElementById('modalPhone');
    this.modalDate = document.getElementById('modalDate');
    this.modalDay = document.getElementById('modalDay');
    this.modalType = document.getElementById('modalType');
    this.modalDesc = document.getElementById('modalDesc');
    
    // Modal Files Display
    this.modalUserImageSection = document.getElementById('modalUserImageSection');
    this.modalUserAttachSection = document.getElementById('modalUserAttachSection');
    
    // Modal Admin Editable Fields
    this.modalAdminName = document.getElementById('modalAdminName');
    this.modalAdminRemark = document.getElementById('modalAdminRemark');
    this.modalStatusSelect = document.getElementById('modalStatusSelect');
    this.modalAdminUpload = document.getElementById('modalAdminUpload');
    this.modalAdminUploadName = document.getElementById('modalAdminUploadName');
    this.modalAdminFileSection = document.getElementById('modalAdminFileSection');
    
    // Modal Save Button
    this.saveModalBtn = document.getElementById('saveModalBtn');
  },

  initRoleSwitcher() {
    this.roleSelector.innerHTML = '';
    PRESET_USERS.forEach(user => {
      const opt = document.createElement('option');
      opt.value = user.username;
      opt.textContent = `${user.fullname} (${user.role === 'admin' ? 'แอดมิน' : user.department})`;
      this.roleSelector.appendChild(opt);
    });
  },

  bindEvents() {
    // Switch User Role
    this.roleSelector.addEventListener('change', async (e) => {
      await this.switchRole(e.target.value);
    });
    
    // Handle Dropdown Type for "อื่นๆ"
    this.repairTypeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'อื่นๆ') {
        this.otherRepairGroup.classList.add('active');
        this.otherRepairInput.required = true;
      } else {
        this.otherRepairGroup.classList.remove('active');
        this.otherRepairInput.required = false;
      }
    });

    // Image upload size check & preview (Cloud D1 requires < 1MB limit for rows)
    const fileLimit = 1000 * 1024; // 1MB
    
    this.userImageUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > fileLimit) {
          alert('⚠️ ไฟล์ภาพขนาดใหญ่เกิน 1MB! เพื่อความรวดเร็วและประหยัดโควตาคลาวด์ D1 โปรดแนบภาพขนาดที่เล็กลงครับ');
          this.userImageUpload.value = '';
          this.userImageName.textContent = '';
          this.userImagePreview.style.display = 'none';
          return;
        }
        
        this.userImageName.textContent = `ไฟล์ภาพ: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
        
        // Show Image Preview
        const reader = new FileReader();
        reader.onload = (event) => {
          this.userImagePreview.src = event.target.result;
          this.userImagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        this.userImageName.textContent = '';
        this.userImagePreview.style.display = 'none';
      }
    });

    // Document attachment uploader
    this.userAttachUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > fileLimit) {
          alert('⚠️ ไฟล์เอกสารขนาดใหญ่เกิน 1MB! โปรดแนบไฟล์เอกสารที่กะทัดรัดขึ้นครับ');
          this.userAttachUpload.value = '';
          this.userAttachName.textContent = '';
          return;
        }
        this.userAttachName.textContent = `เอกสารแนบ: ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
      } else {
        this.userAttachName.textContent = '';
      }
    });
    
    // Admin modal file upload
    this.modalAdminUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > fileLimit) {
          alert('⚠️ ไฟล์ปิดงานของแอดมินขนาดใหญ่เกิน 1MB! โปรดแชร์เป็นลิงก์ภายนอกหรือจำกัดขนาดไฟล์ครับ');
          this.modalAdminUpload.value = '';
          this.modalAdminUploadName.textContent = '';
          return;
        }
        this.modalAdminUploadName.textContent = `ไฟล์งานแอดมิน: ${file.name}`;
      } else {
        this.modalAdminUploadName.textContent = '';
      }
    });

    // Submit User Request Form
    this.userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleUserRequestSubmit();
    });

    // Tabs filtering for User list
    this.userTaskFilterTabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        this.userTaskFilterTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        STATE.activeFilter = e.target.getAttribute('data-status');
        await this.renderUserTasks();
      });
    });

    // Admin Search Bar
    this.adminSearchInput.addEventListener('input', async () => {
      await this.renderKanbanBoard();
    });

    // Close Modal Events
    this.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });
    
    // Save Admin Modal Edit
    this.saveModalBtn.addEventListener('click', async () => {
      await this.handleAdminSaveTask();
    });
  },

  async switchRole(username) {
    const user = PRESET_USERS.find(u => u.username === username);
    if (!user) return;
    
    STATE.currentUser = { ...user };
    
    // Update Header Avatar and Badges
    this.userBadgeAvatar.textContent = user.fullname.charAt(0);
    this.userBadgeName.textContent = user.fullname;
    
    // Show Mode text
    const modeText = STATE.isCloudMode ? 'Cloud D1' : 'Local Simulation';
    this.userBadgeRole.textContent = `${user.role === 'admin' ? 'Admin' : 'User'} (${modeText})`;
    
    if (user.role === 'admin') {
      // Switch view to Admin Dashboard
      this.navBrandLogo.innerHTML = '🛡️';
      this.navRoleName.textContent = `Admin Workspace Overview (${modeText})`;
      this.navRoleSub.textContent = 'ศูนย์ควบคุมบอร์ดบริหารงานและอัปเดตการซ่อมแซม';
      
      this.adminDashboard.classList.remove('hidden');
      this.userDashboard.classList.add('hidden');
      
      await this.renderAdminSummary();
      await this.renderKanbanBoard();
    } else {
      // Switch view to User Dashboard
      this.navBrandLogo.innerHTML = '🔧';
      this.navRoleName.textContent = `User Service Portal (${modeText})`;
      this.navRoleSub.textContent = 'ช่องทางแจ้งขอรับบริการ ปรึกษา และติดตามสถานะงานไอที';
      
      this.adminDashboard.classList.add('hidden');
      this.userDashboard.classList.remove('hidden');
      
      // Auto-prefill user details in Form
      this.userWelcomeName.textContent = user.fullname;
      this.formFullname.value = user.fullname;
      this.formDepartment.value = user.department;
      this.formPhone.value = user.phone;
      
      this.resetUserForm();
      await this.renderUserSummary();
      await this.renderUserTasks();
    }
  },

  resetUserForm() {
    this.userForm.reset();
    this.formFullname.value = STATE.currentUser.fullname;
    this.formDepartment.value = STATE.currentUser.department;
    this.formPhone.value = STATE.currentUser.phone;
    this.repairTypeSelect.value = '';
    this.otherRepairGroup.classList.remove('active');
    this.otherRepairInput.required = false;
    this.userImageName.textContent = '';
    this.userImagePreview.style.display = 'none';
    this.userAttachName.textContent = '';
    
    // Auto populate today's date
    const today = new Date().toISOString().substring(0, 10);
    document.getElementById('reportedDate').value = today;
  },

  async handleUserRequestSubmit() {
    try {
      // Get repair type
      let typeVal = this.repairTypeSelect.value;
      if (typeVal === 'อื่นๆ') {
        typeVal = `อื่นๆ (${this.otherRepairInput.value.trim()})`;
      }
      
      // Date and Day
      const reportedDateVal = document.getElementById('reportedDate').value;
      const dayName = getThaiDayName(reportedDateVal);
      
      // Prepare task object
      const taskId = `REQ-${Date.now().toString().substring(7)}`;
      
      const newTask = {
        id: taskId,
        username: STATE.currentUser.username,
        fullname: this.formFullname.value.trim(),
        department: this.formDepartment.value.trim(),
        phone: this.formPhone.value.trim(),
        repair_type: typeVal,
        description: document.getElementById('description').value.trim(),
        reported_date: reportedDateVal,
        day_str: dayName,
        image_file: null,
        attached_file: null,
        status: 'Pending',
        admin_name: '',
        admin_remark: '',
        admin_upload_file: null
      };

      // Handle Image file conversion
      const imgFile = this.userImageUpload.files[0];
      if (imgFile) {
        newTask.image_file = await fileToBase64(imgFile);
      }

      // Handle attachment file conversion
      const attachFile = this.userAttachUpload.files[0];
      if (attachFile) {
        newTask.attached_file = await fileToBase64(attachFile);
      }

      // Save to database
      await DB.create(newTask);
      
      // Update UI
      this.resetUserForm();
      await this.renderUserSummary();
      await this.renderUserTasks();
      
      alert(`🎉 สร้างใบแจ้งขอซ่อมแซมหมายเลข ${taskId} สำเร็จแล้ว!`);
      
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  },

  async renderUserSummary() {
    const userTasks = await DB.getByUser(STATE.currentUser.username);
    this.sumTotal.textContent = userTasks.length;
    this.sumPending.textContent = userTasks.filter(t => t.status === 'Pending').length;
    this.sumProgress.textContent = userTasks.filter(t => t.status === 'In_Progress').length;
    this.sumCompleted.textContent = userTasks.filter(t => t.status === 'Completed').length;
  },

  async renderAdminSummary() {
    const allTasks = await DB.getAll();
    this.sumTotal.textContent = allTasks.length;
    this.sumPending.textContent = allTasks.filter(t => t.status === 'Pending').length;
    this.sumProgress.textContent = allTasks.filter(t => t.status === 'In_Progress').length;
    this.sumCompleted.textContent = allTasks.filter(t => t.status === 'Completed').length;
  },

  async renderUserTasks() {
    this.userTasksContainer.innerHTML = '';
    const userTasks = await DB.getByUser(STATE.currentUser.username);
    
    // Filter by tab
    let filtered = userTasks;
    if (STATE.activeFilter !== 'All') {
      filtered = userTasks.filter(t => t.status === STATE.activeFilter);
    }
    
    if (filtered.length === 0) {
      this.userTasksContainer.innerHTML = `
        <div class="empty-column-placeholder">
          <div class="empty-icon">📭</div>
          <p>ไม่พบรายการแจ้งซ่อมในหมวดหมู่นี้</p>
        </div>
      `;
      return;
    }
    
    filtered.forEach(task => {
      const card = document.createElement('div');
      card.className = 'user-task-card';
      
      // File previews html
      let filesHtml = '';
      if (task.image_file || task.attached_file || task.admin_upload_file) {
        filesHtml = `<div class="user-task-details" style="grid-column: span 2; border-top: none; padding-top: 0; margin-top: 0;"><div class="detail-label" style="grid-column: span 2;">📎 ไฟล์แนบระบบ:</div>`;
        if (task.image_file) {
          filesHtml += `
            <div class="file-preview-card" style="grid-column: span 2; margin-top:0;">
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${task.image_file.data}" class="file-preview-thumbnail">
                <span style="font-size:0.75rem;">${task.image_file.name}</span>
              </div>
              <button class="file-action-btn" onclick="UI.downloadFile('${task.image_file.name}', '${task.image_file.data}')">💾 ดาวน์โหลด</button>
            </div>
          `;
        }
        if (task.attached_file) {
          filesHtml += `
            <div class="file-preview-card" style="grid-column: span 2; margin-top:4px;">
              <span style="font-size:0.75rem;">📄 ${task.attached_file.name}</span>
              <button class="file-action-btn" onclick="UI.downloadFile('${task.attached_file.name}', '${task.attached_file.data}')">💾 ดาวน์โหลด</button>
            </div>
          `;
        }
        filesHtml += `</div>`;
      }

      // Admin feedback html
      let adminFeedbackHtml = '';
      if (task.status !== 'Pending' && (task.admin_name || task.admin_remark || task.admin_upload_file)) {
        let adminFileHtml = '';
        if (task.admin_upload_file) {
          adminFileHtml = `
            <div class="file-preview-card" style="margin-top: 8px; background: rgba(99, 102, 241, 0.1);">
              <span style="font-size:0.75rem;">📁 เอกสารแนบจากแอดมิน: ${task.admin_upload_file.name}</span>
              <button class="file-action-btn" onclick="UI.downloadFile('${task.admin_upload_file.name}', '${task.admin_upload_file.data}')">💾 ดาวน์โหลด</button>
            </div>
          `;
        }
        
        adminFeedbackHtml = `
          <div class="admin-feedback-box">
            <div class="admin-feedback-header">💬 บันทึกการดำเนินงานจากแอดมิน (${task.admin_name || 'เจ้าหน้าที่ไอที'}):</div>
            <div class="admin-feedback-text">${task.admin_remark || 'กำลังอยู่ระหว่างวิเคราะห์จุดบกพร่องและแก้ไขอุปกรณ์'}</div>
            ${adminFileHtml}
          </div>
        `;
      }

      let statusText = 'รอดำเนินการ';
      if (task.status === 'In_Progress') statusText = 'กำลังดำเนินการ';
      if (task.status === 'Completed') statusText = 'เสร็จสิ้นภารกิจ';
      if (task.status === 'Cancelled') statusText = 'ยกเลิกรายการ';

      card.innerHTML = `
        <div class="user-task-card-header">
          <div class="user-task-title">
            <span class="task-id">${task.id}</span>
            <span class="task-type">${task.repair_type}</span>
          </div>
          <span class="status-badge ${task.status}">${statusText}</span>
        </div>
        <div style="font-size: 0.9rem; font-weight: 500; margin-bottom: 8px;">
          ${task.description}
        </div>
        <div class="user-task-details">
          <div class="detail-item">
            <span class="detail-label">วันเวลาที่แจ้งซ่อม</span>
            <span style="color: var(--text-main); font-weight:500;">วัน${task.day_str} ที่ ${task.reported_date}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">ข้อมูลติดต่อผู้รับบริการ</span>
            <span style="color: var(--text-main); font-weight:500;">คุณ${task.fullname} (โทร. ${task.phone})</span>
          </div>
          ${filesHtml}
          ${adminFeedbackHtml}
        </div>
      `;
      this.userTasksContainer.appendChild(card);
    });
  },

  async renderKanbanBoard() {
    const columns = {
      'Pending': document.querySelector('#colPending .kanban-cards-wrapper'),
      'In_Progress': document.querySelector('#colProgress .kanban-cards-wrapper'),
      'Completed': document.querySelector('#colCompleted .kanban-cards-wrapper'),
      'Cancelled': document.querySelector('#colCancelled .kanban-cards-wrapper')
    };

    // Reset Column Cards lists
    for (let status in columns) {
      if (columns[status]) columns[status].innerHTML = '';
    }

    const allTasks = await DB.getAll();
    const searchQuery = this.adminSearchInput.value.toLowerCase().trim();

    // Filter tasks based on Search Bar (searches Username, Name, Dept, Description, Repair Type)
    const filteredTasks = allTasks.filter(task => {
      if (!searchQuery) return true;
      return (
        task.id.toLowerCase().includes(searchQuery) ||
        task.fullname.toLowerCase().includes(searchQuery) ||
        task.username.toLowerCase().includes(searchQuery) ||
        task.department.toLowerCase().includes(searchQuery) ||
        task.repair_type.toLowerCase().includes(searchQuery) ||
        task.description.toLowerCase().includes(searchQuery) ||
        (task.admin_name && task.admin_name.toLowerCase().includes(searchQuery))
      );
    });

    // Counts for header columns
    const counts = { 'Pending': 0, 'In_Progress': 0, 'Completed': 0, 'Cancelled': 0 };

    filteredTasks.forEach(task => {
      if (columns[task.status]) {
        counts[task.status]++;
        const card = this.createKanbanCard(task);
        columns[task.status].appendChild(card);
      }
    });

    // Update Counts in column headers
    document.querySelector('#colPending .column-count').textContent = counts['Pending'];
    document.querySelector('#colProgress .column-count').textContent = counts['In_Progress'];
    document.querySelector('#colCompleted .column-count').textContent = counts['Completed'];
    document.querySelector('#colCancelled .column-count').textContent = counts['Cancelled'];

    // Render Empty Placeholders if column is empty
    for (let status in columns) {
      if (counts[status] === 0) {
        columns[status].innerHTML = `
          <div class="empty-column-placeholder">
            <div class="empty-icon">📂</div>
            <p style="font-size:0.75rem;">ว่างเปล่า</p>
          </div>
        `;
      }
    }

    // Set up Drag and Drop on Columns
    this.setupDragAndDropEvents();
  },

  createKanbanCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.setAttribute('data-id', task.id);
    
    // Attachments indicator icons
    let attachmentsHtml = '';
    if (task.image_file || task.attached_file) {
      attachmentsHtml = `
        <div class="attachments-indicator">
          ${task.image_file ? '<span class="indicator-icon" title="มีไฟล์ภาพแนบ">🖼️</span>' : ''}
          ${task.attached_file ? '<span class="indicator-icon" title="มีไฟล์เอกสารแนบ">📎</span>' : ''}
        </div>
      `;
    }

    let adminBadgeHtml = '';
    if (task.admin_name) {
      adminBadgeHtml = `<span style="font-size:0.7rem; background:rgba(99,102,241,0.15); padding:1px 6px; border-radius:3px; color:#c7d2fe;">🔧 ${task.admin_name}</span>`;
    }

    card.innerHTML = `
      <div class="task-card-header">
        <span class="task-id">${task.id}</span>
        <span class="task-type" style="font-size:0.65rem;">${task.repair_type.split(' (')[0]}</span>
      </div>
      <div class="task-card-body">
        <h4>${task.description}</h4>
      </div>
      <div class="task-card-meta">
        <div class="meta-item">
          👤 <span>คุณ${task.fullname.split(' ')[0]}</span>
        </div>
        <div class="meta-item">
          🏢 <span>${task.department.split(' ')[0]}</span>
        </div>
        <div class="meta-item full-width">
          📅 <span>วัน${task.day_str}ที่ ${task.reported_date}</span>
        </div>
      </div>
      <div class="task-card-footer">
        ${adminBadgeHtml}
        ${attachmentsHtml}
      </div>
    `;

    // Click to Open Admin Details / Edit Modal
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        this.openAdminTaskModal(task.id);
      }
    });

    return card;
  },

  setupDragAndDropEvents() {
    const cards = document.querySelectorAll('.task-card');
    const cols = document.querySelectorAll('.kanban-column');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('dragover');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('dragover');
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('dragover');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = col.getAttribute('data-status');
        
        if (taskId && targetStatus) {
          const task = await DB.getById(taskId);
          if (task && task.status !== targetStatus) {
            await DB.update(taskId, { status: targetStatus });
            await this.renderAdminSummary();
            await this.renderKanbanBoard();
          }
        }
      });
    });
  },

  async openAdminTaskModal(taskId) {
    const task = await DB.getById(taskId);
    if (!task) return;

    // Load Task Details into modal text
    this.modalTaskId.textContent = task.id;
    this.modalTitle.textContent = `รายละเอียดคำขอซ่อมแซม: ${task.id}`;
    this.modalUsername.textContent = task.username;
    this.modalFullname.textContent = task.fullname;
    this.modalDept.textContent = task.department;
    this.modalPhone.textContent = task.phone;
    this.modalDate.textContent = task.reported_date;
    this.modalDay.textContent = `วัน${task.day_str}`;
    this.modalType.textContent = task.repair_type;
    this.modalDesc.textContent = task.description;

    // Render User Attachment sections
    this.modalUserImageSection.innerHTML = '';
    if (task.image_file) {
      this.modalUserImageSection.innerHTML = `
        <div class="file-preview-card">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${task.image_file.data}" class="file-preview-thumbnail">
            <span style="font-size:0.75rem; max-width: 150px; overflow:hidden; text-overflow:ellipsis;">${task.image_file.name}</span>
          </div>
          <button class="file-action-btn" onclick="UI.downloadFile('${task.image_file.name}', '${task.image_file.data}')">💾 ดาวน์โหลด</button>
        </div>
      `;
    } else {
      this.modalUserImageSection.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">ไม่มีรูปภาพแนบ</span>`;
    }

    this.modalUserAttachSection.innerHTML = '';
    if (task.attached_file) {
      this.modalUserAttachSection.innerHTML = `
        <div class="file-preview-card">
          <span style="font-size:0.75rem; max-width: 180px; overflow:hidden; text-overflow:ellipsis;">📄 ${task.attached_file.name}</span>
          <button class="file-action-btn" onclick="UI.downloadFile('${task.attached_file.name}', '${task.attached_file.data}')">💾 ดาวน์โหลด</button>
        </div>
      `;
    } else {
      this.modalUserAttachSection.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">ไม่มีเอกสารแนบ</span>`;
    }

    // Set Admin inputs
    this.modalAdminName.value = task.admin_name || STATE.currentUser.fullname;
    this.modalAdminRemark.value = task.admin_remark || '';
    this.modalStatusSelect.value = task.status;
    
    // Admin upload section reset
    this.modalAdminUpload.value = '';
    this.modalAdminUploadName.textContent = '';
    
    // Existing admin file
    this.modalAdminFileSection.innerHTML = '';
    if (task.admin_upload_file) {
      this.modalAdminFileSection.innerHTML = `
        <div class="file-preview-card" style="margin-top:8px; background:rgba(99, 102, 241, 0.08);">
          <span style="font-size:0.75rem; max-width: 180px; overflow:hidden; text-overflow:ellipsis;">📁 ${task.admin_upload_file.name}</span>
          <button class="file-action-btn" onclick="UI.downloadFile('${task.admin_upload_file.name}', '${task.admin_upload_file.data}')">💾 ดาวน์โหลด</button>
        </div>
      `;
    }

    // Open Modal Overlay
    this.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
  },

  closeModal() {
    this.modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  },

  async handleAdminSaveTask() {
    const taskId = this.modalTaskId.textContent;
    const task = await DB.getById(taskId);
    if (!task) return;

    const updatedData = {
      admin_name: this.modalAdminName.value.trim(),
      admin_remark: this.modalAdminRemark.value.trim(),
      status: this.modalStatusSelect.value
    };

    // Check if new Admin file was uploaded
    const adminFile = this.modalAdminUpload.files[0];
    if (adminFile) {
      updatedData.admin_upload_file = await fileToBase64(adminFile);
    }

    // Save update
    await DB.update(taskId, updatedData);
    
    // Refresh admin board
    await this.renderAdminSummary();
    await this.renderKanbanBoard();
    
    this.closeModal();
    alert(`✏️ บันทึกการแก้ไขงาน ${taskId} เรียบร้อยแล้ว!`);
  },

  downloadFile(fileName, base64Data) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export entire Database to JSON file for download
  async exportDatabase() {
    const tasks = await DB.getAll();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `repair_database_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchorElem.click();
  },

  // Import Database from JSON file
  async importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed)) {
          const success = await DB.import(parsed);
          if (success) {
            alert('📥 นำเข้าฐานข้อมูลและฟื้นฟูระบบสำเร็จ!');
            await this.switchRole(STATE.currentUser.username);
          } else {
            alert('รูปแบบไฟล์ฐานข้อมูลไม่ถูกต้อง');
          }
        } else {
          alert('ข้อมูลที่นำเข้าไม่ใช่โครงสร้างที่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
};

// Initialize DB and UI
window.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  await UI.init();
});
