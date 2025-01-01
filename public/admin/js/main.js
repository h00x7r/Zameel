document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize
    loadAdminProfile();
    setupNavigation();
    setupEventListeners();
    loadDashboardData();
});

// Load admin profile
async function loadAdminProfile() {
    try {
        const response = await fetch('/api/admin/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('adminEmail').textContent = data.email;
            setupPermissions(data.role, data.permissions);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            pages.forEach(page => {
                if (page.id === `${targetPage}-page`) {
                    page.classList.remove('hidden');
                    loadPageData(targetPage);
                } else {
                    page.classList.add('hidden');
                }
            });
        });
    });

    // Mobile sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('-translate-x-full');
    });
}

// Setup event listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });

    // Add Admin
    document.getElementById('addAdminBtn')?.addEventListener('click', () => {
        document.getElementById('addAdminModal').classList.remove('hidden');
    });

    // Add Service
    document.getElementById('addServiceBtn')?.addEventListener('click', () => {
        document.getElementById('addServiceModal').classList.remove('hidden');
    });

    // Upload Media
    document.getElementById('uploadMediaBtn')?.addEventListener('click', () => {
        document.getElementById('uploadMediaModal').classList.remove('hidden');
    });

    // Close modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });

    // Form submissions
    setupFormSubmissions();
}

// Setup form submissions
function setupFormSubmissions() {
    // Add Admin Form
    document.getElementById('addAdminForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const permissions = {};
        formData.getAll('permissions').forEach(perm => {
            permissions[perm] = true;
        });

        try {
            const response = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    role: formData.get('role'),
                    permissions
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Admin added successfully');
                e.target.reset();
                document.getElementById('addAdminModal').classList.add('hidden');
                loadPageData('admins');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            alert(error.message || 'Error adding admin');
        }
    });

    // Add Service Form
    document.getElementById('addServiceForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const response = await fetch('/api/admin/services', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                alert('Service added successfully');
                e.target.reset();
                document.getElementById('addServiceModal').classList.add('hidden');
                loadPageData('services');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error adding service:', error);
            alert(error.message || 'Error adding service');
        }
    });

    // Upload Media Form
    document.getElementById('uploadMediaForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const response = await fetch('/api/admin/media/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                alert('Media uploaded successfully');
                e.target.reset();
                document.getElementById('uploadMediaModal').classList.add('hidden');
                loadPageData('media');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error uploading media:', error);
            alert(error.message || 'Error uploading media');
        }
    });
}

// Load page data
async function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'admins':
            await loadAdmins();
            break;
        case 'media':
            await loadMedia();
            break;
        case 'services':
            await loadServices();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('totalUsers').textContent = data.totalUsers;
            document.getElementById('totalServices').textContent = data.totalServices;
            document.getElementById('totalMedia').textContent = data.totalMedia;
            document.getElementById('totalAdmins').textContent = data.totalAdmins;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load admins
async function loadAdmins() {
    try {
        const response = await fetch('/api/admin/admins', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            const tbody = document.getElementById('adminsList');
            tbody.innerHTML = '';
            
            data.forEach(admin => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">${admin.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${admin.role}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editAdmin('${admin._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" onclick="deleteAdmin('${admin._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

// Load media
async function loadMedia() {
    try {
        const response = await fetch('/api/admin/media', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            const grid = document.getElementById('mediaGrid');
            grid.innerHTML = '';
            
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'media-item';
                div.innerHTML = `
                    <img src="${item.url}" alt="${item.name}">
                    <div class="overlay">
                        <div class="actions">
                            <button onclick="copyMediaUrl('${item.url}')">
                                <i class="fas fa-link"></i>
                            </button>
                            <button onclick="deleteMedia('${item._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(div);
            });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading media:', error);
    }
}

// Load services
async function loadServices() {
    try {
        const response = await fetch('/api/admin/services', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            const grid = document.getElementById('servicesList');
            grid.innerHTML = '';
            
            data.forEach(service => {
                const div = document.createElement('div');
                div.className = 'service-card';
                div.innerHTML = `
                    <img src="${service.imageUrl}" alt="${service.name}">
                    <div class="content">
                        <h3 class="text-lg font-semibold">${service.name}</h3>
                        <p class="text-gray-600">${service.description}</p>
                        <div class="actions">
                            <button class="text-blue-600 hover:text-blue-800" onclick="editService('${service._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-800" onclick="deleteService('${service._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(div);
            });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Setup permissions
function setupPermissions(role, permissions) {
    const adminSection = document.querySelector('[data-page="admins"]');
    const mediaSection = document.querySelector('[data-page="media"]');
    const servicesSection = document.querySelector('[data-page="services"]');
    const usersSection = document.querySelector('[data-page="users"]');

    if (role === 'superadmin') {
        // Show everything
        return;
    }

    if (role === 'admin') {
        adminSection?.classList.add('hidden');
    } else {
        // Editor - check specific permissions
        if (!permissions.manageAdmins) adminSection?.classList.add('hidden');
        if (!permissions.manageContent) {
            mediaSection?.classList.add('hidden');
            servicesSection?.classList.add('hidden');
        }
        if (!permissions.manageUsers) usersSection?.classList.add('hidden');
    }
}

// Utility functions
function editAdmin(id) {
    // Implement edit admin functionality
}

function deleteAdmin(id) {
    if (confirm('Are you sure you want to delete this admin?')) {
        // Implement delete admin functionality
    }
}

function editService(id) {
    // Implement edit service functionality
}

function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        // Implement delete service functionality
    }
}

function copyMediaUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('URL copied to clipboard!');
    });
}

function deleteMedia(id) {
    if (confirm('Are you sure you want to delete this media?')) {
        // Implement delete media functionality
    }
}
