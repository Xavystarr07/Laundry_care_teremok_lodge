// imageInsert.js - Optional image on page 2 for print/PDF
// Features: image-only validation, size picker (Small/Medium/Full), centred print

(function () {

    let currentSize = 'medium'; // default

    // ── Page 2 print container ────────────────────────────────────────────────
    const printPage = document.createElement('div');
    printPage.id = 'printPage2';
    printPage.classList.add('no-image');
    printPage.innerHTML = `<div id="page2ImageContainer"><img id="page2Image" src="" alt="Attached Image"></div>`;
    document.body.appendChild(printPage);

    // ── Screen preview bar ────────────────────────────────────────────────────
    const previewBar = document.createElement('div');
    previewBar.id = 'imagePreviewBar';
    previewBar.innerHTML = `
        <img id="imagePreviewThumb" src="" alt="Preview">
        <div id="imagePreviewInfo">
            <span id="imageFileName">No image selected</span>
            <div id="imageSizePicker">
                <span class="size-label">Size:</span>
                <button type="button" class="size-btn" data-size="small">Small</button>
                <button type="button" class="size-btn active" data-size="medium">Medium</button>
                <button type="button" class="size-btn" data-size="full">Full</button>
            </div>
        </div>
        <button type="button" id="removeImageBtn">✕ Remove</button>
    `;

    const anchor = document.querySelector('.image-preview-anchor');
    (anchor || document.body).appendChild(previewBar);

    // ── Size picker styles injected ───────────────────────────────────────────
    const sizeStyle = document.createElement('style');
    sizeStyle.textContent = `
        #imagePreviewInfo {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
        }
        #imageSizePicker {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }
        .size-label {
            font-size: 11px;
            color: #888;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .size-btn {
            background: #f0f0f0;
            color: #555;
            border: 1.5px solid #ddd;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 11px;
            cursor: pointer;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-weight: 600;
            transition: all 0.18s;
            margin: 0 !important;
            box-shadow: none !important;
        }
        .size-btn:hover { background: #e0e0e0; border-color: #bbb; }
        .size-btn.active {
            background: linear-gradient(135deg, #06b6d4, #0284c7);
            color: white;
            border-color: transparent;
        }

        /* Print page 2 — always centred */
        #printPage2 {
            display: none;
            width: 210mm;
            min-height: 100mm;
            justify-content: center;
            align-items: center;
            padding: 10mm;
            box-sizing: border-box;
        }
        #page2ImageContainer {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
        }

        /* Three size classes applied to page2Image */
        #page2Image.img-small  { max-width: 80mm;  max-height: 80mm;  }
        #page2Image.img-medium { max-width: 140mm; max-height: 140mm; }
        #page2Image.img-full   { max-width: 190mm; max-height: 257mm; }

        #page2Image { object-fit: contain; display: block; }
    `;
    document.head.appendChild(sizeStyle);

    // ── Hidden file input ─────────────────────────────────────────────────────
    const fileInput = document.createElement('input');
    fileInput.type   = 'file';
    fileInput.accept = 'image/*';
    fileInput.id     = 'imageFileInput';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // ── Insert Image button ───────────────────────────────────────────────────
    document.getElementById('insertImageBtn')?.addEventListener('click', e => {
        e.preventDefault();
        fileInput.click();
    });

    // ── File chosen ───────────────────────────────────────────────────────────
    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showPopup('error', 'Only image files are allowed.', '💡 Select a JPG, PNG, GIF or WebP file.', 5000);
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = ev => {
            const src = ev.target.result;
            const img = document.getElementById('page2Image');
            img.src = src;
            applySizeClass(img, currentSize);

            const page2 = document.getElementById('printPage2');
            page2.classList.remove('no-image');
            page2.style.display = 'flex';

            document.getElementById('imagePreviewThumb').src = src;
            document.getElementById('imageFileName').textContent = file.name;
            previewBar.classList.add('visible');
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    });

    // ── Size picker clicks ────────────────────────────────────────────────────
    previewBar.addEventListener('click', e => {
        const btn = e.target.closest('.size-btn');
        if (!btn) return;

        currentSize = btn.dataset.size;

        // Update active state
        previewBar.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply to print image
        const img = document.getElementById('page2Image');
        if (img?.src) applySizeClass(img, currentSize);
    });

    function applySizeClass(img, size) {
        img.classList.remove('img-small', 'img-medium', 'img-full');
        img.classList.add('img-' + size);
    }

    // ── Remove image ──────────────────────────────────────────────────────────
    document.addEventListener('click', e => {
        if (e.target.id !== 'removeImageBtn') return;

        const img = document.getElementById('page2Image');
        img.src = '';
        img.className = '';

        const page2 = document.getElementById('printPage2');
        page2.classList.add('no-image');
        page2.style.display = 'none';

        document.getElementById('imagePreviewThumb').src = '';
        document.getElementById('imageFileName').textContent = 'No image selected';
        previewBar.classList.remove('visible');
        currentSize = 'medium';
        previewBar.querySelectorAll('.size-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.size === 'medium');
        });
    });

})();
