
class DentalInstrumentsApp {
    constructor() {
        this.clinicInstruments = [];
        this.allInstruments = [];
        this.filteredInstruments = [];
        this.activeSubject = '';
        this.searchTerm = '';
        this.currentImages = [];
        this.currentImageIndex = 0;

        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderSubjects();
    }

    async loadData() {
        try {
            // Load clinic instruments
            const clinicResponse = await fetch('مواد العيادة/clinic_instruments.csv');
            const clinicText = await clinicResponse.text();
            this.clinicInstruments = this.parseCSV(clinicText);

            // Load all instruments
            const instrumentsResponse = await fetch('كل الادوات/all_instruments.csv');
            const instrumentsText = await instrumentsResponse.text();
            this.allInstruments = this.parseCSV(instrumentsText);

        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to inline data if CSV loading fails
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        this.clinicInstruments = [
            { المادة: 'oral surgery', Status: 'Not started' },
            { المادة: 'orthodontics', Status: 'Not started' },
            { المادة: 'operative', Status: 'Not started' },
            { المادة: 'prosthodontics', Status: 'Not started' },
            { المادة: 'periodontology', Status: 'Not started' }
        ];

        this.allInstruments = [
            {
                الاسم: 'gloves& جفوف& قفازات',
                الصورة: 'كل الادوات/photos/download_(8).jpeg',
                'المادة المرتبطة': 'oral surgery, operative, periodontology, prosthodontics',
                الملاحظات: 'كلش تفيدك كتعقيم',
                السعر: 'الباكيت 5000',
                group: 'الشغلات المزعجة'
            },
            {
                الاسم: 'mirror& مراية& ميرور',
                الصورة: 'كل الادوات/photos/download.png',
                'المادة المرتبطة': 'oral surgery, operative, periodontology, prosthodontics',
                الملاحظات: 'اداة فحص',
                السعر: '',
                group: 'ميرور*توزر*بروب'
            },
            {
                الاسم: 'amalgam& املكم',
                الصورة: 'كل الادوات/photos/download_(6).jpeg',
                'المادة المرتبطة': 'operative',
                الملاحظات: 'بالاوبرتف مطلوب منك حالات املغم',
                السعر: '500',
                group: 'amalgam instruments'
            }
        ];
    }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        });
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"' && !inQuotes) {
                inQuotes = true;
            } else if (char === '"' && inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else if (char === '"' && inQuotes) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    cleanSubjectName(subject) {
        // Remove Notion URLs and extra spaces
        return subject.replace(/\(https:\/\/.*?\)/, '').trim();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const backButton = document.getElementById('backToSubjects');
        const imageModal = document.getElementById('imageModal');
        const closeModal = document.querySelector('.close');
        const prevImage = document.getElementById('prevImage');
        const nextImage = document.getElementById('nextImage');

        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndRenderInstruments();
        });

        backButton.addEventListener('click', () => {
            this.showSubjectView();
        });

        closeModal.addEventListener('click', () => {
            this.closeImageModal();
        });

        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                this.closeImageModal();
            }
        });

        prevImage.addEventListener('click', () => {
            this.showPreviousImage();
        });

        nextImage.addEventListener('click', () => {
            this.showNextImage();
        });

        // Keyboard navigation for modal
        document.addEventListener('keydown', (e) => {
            if (imageModal.style.display === 'block') {
                if (e.key === 'Escape') {
                    this.closeImageModal();
                } else if (e.key === 'ArrowLeft') {
                    this.showPreviousImage();
                } else if (e.key === 'ArrowRight') {
                    this.showNextImage();
                }
            }
        });
    }

    renderSubjects() {
        const subjectsList = document.getElementById('subjectsList');
        subjectsList.innerHTML = '';

        this.clinicInstruments.forEach(clinic => {
            const button = document.createElement('button');
            button.className = 'subject-button';
            button.textContent = this.cleanSubjectName(clinic.المادة);
            button.addEventListener('click', () => {
                this.selectSubject(this.cleanSubjectName(clinic.المادة));
            });
            subjectsList.appendChild(button);
        });
    }

    selectSubject(subject) {
        this.activeSubject = subject;
        this.searchTerm = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('selectedSubjectTitle').textContent = subject;
        this.showInstrumentsView();
        this.filterAndRenderInstruments();
    }

    showSubjectView() {
        document.getElementById('subjectView').style.display = 'block';
        document.getElementById('instrumentsView').style.display = 'none';
        this.activeSubject = '';
    }

    showInstrumentsView() {
        document.getElementById('subjectView').style.display = 'none';
        document.getElementById('instrumentsView').style.display = 'block';
    }

    filterAndRenderInstruments() {
        if (!this.activeSubject) {
            return;
        }

        // Filter instruments by subject
        this.filteredInstruments = this.allInstruments.filter(instrument => {
            const relatedSubjects = instrument['المادة المرتبطة'] || '';
            const cleanedSubjects = relatedSubjects.split(',').map(s => this.cleanSubjectName(s.trim()));
            
            if (!cleanedSubjects.some(subject => subject.toLowerCase() === this.activeSubject.toLowerCase())) {
                return false;
            }

            // Filter by search term
            if (this.searchTerm) {
                const searchFields = [
                    instrument.الاسم,
                    instrument.الملاحظات,
                    instrument.group
                ].join(' ').toLowerCase();

                if (!searchFields.includes(this.searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.renderGroupedInstruments();
    }

    renderGroupedInstruments() {
        const groupsContainer = document.getElementById('groupsContainer');
        groupsContainer.innerHTML = '';

        // Group instruments by their group field
        const groupedInstruments = this.groupInstrumentsByGroup();

        if (Object.keys(groupedInstruments).length === 0) {
            groupsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">لا توجد أدوات تطابق المعايير المحددة</div>';
            return;
        }

        Object.entries(groupedInstruments).forEach(([groupName, instruments]) => {
            const groupSection = this.createGroupSection(groupName, instruments);
            groupsContainer.appendChild(groupSection);
        });
    }

    groupInstrumentsByGroup() {
        const grouped = {};
        
        this.filteredInstruments.forEach(instrument => {
            const groupName = instrument.group || 'أدوات أخرى';
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(instrument);
        });

        return grouped;
    }

    createGroupSection(groupName, instruments) {
        const section = document.createElement('div');
        section.className = 'group-section';

        const header = document.createElement('div');
        header.className = 'group-header';
        header.innerHTML = `
            <h4>${groupName} (${instruments.length})</h4>
            <span class="group-toggle">▼</span>
        `;

        const content = document.createElement('div');
        content.className = 'group-content';

        const grid = document.createElement('div');
        grid.className = 'instruments-grid';

        instruments.forEach(instrument => {
            const card = this.createInstrumentCard(instrument);
            grid.appendChild(card);
        });

        content.appendChild(grid);

        header.addEventListener('click', () => {
            const isExpanded = content.classList.contains('expanded');
            const toggle = header.querySelector('.group-toggle');
            
            if (isExpanded) {
                content.classList.remove('expanded');
                toggle.classList.remove('expanded');
            } else {
                content.classList.add('expanded');
                toggle.classList.add('expanded');
            }
        });

        section.appendChild(header);
        section.appendChild(content);

        return section;
    }

    createInstrumentCard(instrument) {
        const card = document.createElement('div');
        card.className = 'instrument-card';

        // Handle multiple images
        const images = this.getInstrumentImages(instrument);
        const hasImages = images.length > 0;
        
        let imageElement;
        if (hasImages) {
            const firstImage = images[0];
            imageElement = `
                <div class="instrument-image-container" data-images='${JSON.stringify(images)}'>
                    <img src="${firstImage}" alt="${instrument.الاسم}" class="instrument-image" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=no-image>لا توجد صورة</div>';">
                    ${images.length > 1 ? `<div class="image-indicator">${images.length} صور</div>` : ''}
                </div>
            `;
        } else {
            imageElement = `<div class="no-image">لا توجد صورة</div>`;
        }

        card.innerHTML = `
            ${imageElement}
            <div class="instrument-content">
                <div class="instrument-name">${instrument.الاسم}</div>
                ${instrument.السعر ? `<div class="instrument-price">${instrument.السعر}</div>` : ''}
                ${instrument.الملاحظات ? `<div class="instrument-notes">${instrument.الملاحظات}</div>` : ''}
            </div>
        `;

        // Add click event for image modal
        if (hasImages) {
            const imageContainer = card.querySelector('.instrument-image-container');
            imageContainer.addEventListener('click', () => {
                this.openImageModal(images, 0);
            });
        }

        return card;
    }

    getInstrumentImages(instrument) {
        if (!instrument.الصورة) return [];
        
        const imageNames = instrument.الصورة.split(',').map(img => img.trim()).filter(img => img);
        return imageNames.map(imageName => {
            const fileName = imageName.split('/').pop();
            return `كل الادوات/photos/${fileName}`;
        });
    }

    openImageModal(images, startIndex = 0) {
        this.currentImages = images;
        this.currentImageIndex = startIndex;
        
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const counter = document.getElementById('imageCounter');
        const thumbnails = document.getElementById('imageThumbnails');
        
        modal.style.display = 'block';
        this.updateModalImage();
        this.updateImageCounter();
        this.renderThumbnails();
        
        // Hide navigation buttons if only one image
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        if (images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    }

    closeImageModal() {
        document.getElementById('imageModal').style.display = 'none';
    }

    showPreviousImage() {
        if (this.currentImages.length <= 1) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentImages.length) % this.currentImages.length;
        this.updateModalImage();
        this.updateImageCounter();
        this.updateActiveThumbnail();
    }

    showNextImage() {
        if (this.currentImages.length <= 1) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
        this.updateModalImage();
        this.updateImageCounter();
        this.updateActiveThumbnail();
    }

    updateModalImage() {
        const modalImage = document.getElementById('modalImage');
        modalImage.src = this.currentImages[this.currentImageIndex];
    }

    updateImageCounter() {
        const counter = document.getElementById('imageCounter');
        if (this.currentImages.length > 1) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.currentImages.length}`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }

    renderThumbnails() {
        const thumbnails = document.getElementById('imageThumbnails');
        thumbnails.innerHTML = '';
        
        if (this.currentImages.length <= 1) return;
        
        this.currentImages.forEach((image, index) => {
            const thumb = document.createElement('img');
            thumb.src = image;
            thumb.className = 'thumbnail';
            if (index === this.currentImageIndex) {
                thumb.classList.add('active');
            }
            
            thumb.addEventListener('click', () => {
                this.currentImageIndex = index;
                this.updateModalImage();
                this.updateImageCounter();
                this.updateActiveThumbnail();
            });
            
            thumbnails.appendChild(thumb);
        });
    }

    updateActiveThumbnail() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            if (index === this.currentImageIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DentalInstrumentsApp();
});
