const state = {
    patients: JSON.parse(localStorage.getItem('cs_patients')) || [],
    appointments: JSON.parse(localStorage.getItem('cs_appointments')) || []
};

const saveToLocal = () => {
    localStorage.setItem('cs_patients', JSON.stringify(state.patients));
    localStorage.setItem('cs_appointments', JSON.stringify(state.appointments));
};

const views = document.querySelectorAll('.view-section');
const navBtns = document.querySelectorAll('.nav-btn');
const viewTitle = document.getElementById('view-title');

const switchView = (viewId) => {
    views.forEach(v => v.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${viewId}-view`).classList.add('active');
    document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
    viewTitle.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
    
    if(viewId === 'dashboard') updateDashboard();
    if(viewId === 'patients') renderPatients();
    if(viewId === 'appointments') {
        renderAppointments();
        populatePatientSelect();
    }
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
});

const patientModal = document.getElementById('patient-modal');
const addPatientBtn = document.getElementById('add-patient-btn');
const closeModals = document.querySelectorAll('.close-modal');
const addPatientForm = document.getElementById('add-patient-form');
const patientPhotoInput = document.getElementById('patient-photo');
const photoPreview = document.getElementById('photo-preview');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const fileUploadZone = document.getElementById('file-upload-zone');

const imageModal = document.getElementById('image-modal');
const fullResImage = document.getElementById('full-res-image');

addPatientBtn.onclick = () => patientModal.classList.add('active');

closeModals.forEach(btn => {
    btn.onclick = () => {
        patientModal.classList.remove('active');
        imageModal.classList.remove('active');
        if(btn.id !== 'close-image-modal') {
            addPatientForm.reset();
            photoPreview.classList.add('hidden');
            uploadPlaceholder.classList.remove('hidden');
        }
    };
});

fileUploadZone.onclick = () => patientPhotoInput.click();

patientPhotoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            photoPreview.src = event.target.result;
            photoPreview.classList.remove('hidden');
            uploadPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
};

addPatientForm.onsubmit = (e) => {
    e.preventDefault();
    const newPatient = {
        id: Date.now(),
        name: document.getElementById('patient-name').value,
        age: document.getElementById('patient-age').value,
        gender: document.getElementById('patient-gender').value,
        condition: document.getElementById('patient-condition').value,
        photo: photoPreview.src || '',
        createdAt: new Date().toISOString()
    };
    
    state.patients.push(newPatient);
    saveToLocal();
    patientModal.classList.remove('active');
    addPatientForm.reset();
    photoPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    renderPatients();
    updateDashboard();
};

const renderPatients = () => {
    const list = document.getElementById('patient-list');
    list.innerHTML = state.patients.length ? '' : '<p class="text-muted">No patients recorded yet.</p>';
    
    state.patients.forEach(p => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.innerHTML = `
            <img src="${p.photo || 'https://via.placeholder.com/80'}" class="patient-thumb" onclick="openImagePreview('${p.photo}')">
            <div class="patient-info">
                <h4>${p.name}</h4>
                <p>${p.age} years • ${p.gender}</p>
                <p class="condition-text">${p.condition}</p>
            </div>
            <button class="delete-btn" onclick="deletePatient(${p.id})">🗑️</button>
        `;
        list.appendChild(card);
    });
};

window.openImagePreview = (src) => {
    if(!src || src === 'undefined' || src === 'null') return;
    fullResImage.src = src;
    imageModal.classList.add('active');
};

window.deletePatient = (id) => {
    state.patients = state.patients.filter(p => p.id !== id);
    state.appointments = state.appointments.filter(a => a.patientId != id);
    saveToLocal();
    renderPatients();
    updateDashboard();
};

const populatePatientSelect = () => {
    const select = document.getElementById('appointment-patient-select');
    select.innerHTML = '<option value="">Select Patient</option>';
    state.patients.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
};

const bookApptForm = document.getElementById('book-appointment-form');
bookApptForm.onsubmit = (e) => {
    e.preventDefault();
    const patientId = document.getElementById('appointment-patient-select').value;
    const patient = state.patients.find(p => p.id == patientId);
    
    const newAppt = {
        id: Date.now(),
        patientId: patientId,
        patientName: patient.name,
        date: document.getElementById('appointment-date').value,
        time: document.getElementById('appointment-time').value,
        status: 'Scheduled'
    };
    
    state.appointments.push(newAppt);
    saveToLocal();
    bookApptForm.reset();
    renderAppointments();
    updateDashboard();
};

const renderAppointments = () => {
    const list = document.getElementById('appointment-records');
    list.innerHTML = '<h3 style="margin-bottom: 1.5rem">Upcoming Appointments</h3>';
    
    if(!state.appointments.length) {
        list.innerHTML += '<p class="text-muted">No appointments scheduled.</p>';
        return;
    }

    state.appointments.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(a => {
        const item = document.createElement('div');
        item.className = 'appointment-item';
        item.innerHTML = `
            <div>
                <strong>${a.patientName}</strong><br>
                <small style="color: var(--text-muted)">${a.date} at ${a.time}</small>
            </div>
            <span class="badge">${a.status}</span>
        `;
        list.appendChild(item);
    });
};

const updateDashboard = () => {
    document.getElementById('stat-total-patients').textContent = state.patients.length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = state.appointments.filter(a => a.date === today).length;
    document.getElementById('stat-today-appts').textContent = todayAppts;
    
    const recentList = document.getElementById('recent-appointments-list');
    recentList.innerHTML = '';
    
    state.appointments.slice(-5).reverse().forEach(a => {
        const div = document.createElement('div');
        div.className = 'appointment-item';
        div.style.padding = '12px 0';
        div.innerHTML = `
            <div>
                <strong>${a.patientName}</strong><br>
                <small style="color: var(--text-muted)">${a.date} at ${a.time}</small>
            </div>
        `;
        recentList.appendChild(div);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});

const helperStyles = document.createElement('style');
helperStyles.textContent = `
    .condition-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
        margin-top: 4px;
    }
`;
document.head.appendChild(helperStyles);

document.getElementById("book-appointment-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const patient = document.getElementById("appointment-patient-select").value;
    const doctor = document.getElementById("appointment-doctor").value; // ✅ YEH HAI TERA CODE
    const date = document.getElementById("appointment-date").value;
    const time = document.getElementById("appointment-time").value;

    const appointmentList = document.getElementById("appointment-records");

    const newItem = document.createElement("div");
    newItem.classList.add("appointment-item");

    newItem.innerHTML = `
        <div>
            <p><strong>Patient:</strong> ${patient}</p>
            <p><strong>Doctor:</strong> ${doctor}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
        </div>
        <span class="badge">Confirmed</span>
    `;

    appointmentList.appendChild(newItem);

    this.reset();
});
