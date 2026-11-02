"use strict";

document.addEventListener("DOMContentLoaded", function () {

    // highlight the current page in the navigation
    const currentPage = location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-links a").forEach(function (link) {
        if (link.getAttribute("href") === currentPage) {
            link.setAttribute("aria-current", "page");
        }
    });

    // adding a live search to the Services page
    const services = document.querySelector(".services-cards");

    if (services) {
        const searchWrap = document.createElement("div");
        searchWrap.className = "service-search";

        searchWrap.innerHTML = `
            <label for="service-search-input">Search services</label>
            <input
                id="service-search-input"
                type="search"
                placeholder="Search education, campaigns, advocacy..."
                aria-describedby="service-search-status"
            >
            <p id="service-search-status" role="status" aria-live="polite"></p>
        `;

        services.parentNode.insertBefore(searchWrap, services);

        const input = searchWrap.querySelector("input");
        const status = searchWrap.querySelector("#service-search-status");
        const cards = Array.from(
            services.querySelectorAll(".service-card")
        );

        function filterServices() {
            const searchTerm = input.value.trim().toLowerCase();
            let visibleCount = 0;

            cards.forEach(function (card) {
                const matches = card.textContent
                    .toLowerCase()
                    .includes(searchTerm);

                card.hidden = !matches;

                if (matches) {
                    visibleCount++;
                }
            });

            status.textContent =
                visibleCount + " service(s) shown.";
        }

        input.addEventListener("input", filterServices);
        filterServices();
    }

    // image gallery lightbox: previous/next, keyboard, swipe, zoom, captions
    const photos = Array.from(
        document.querySelectorAll(".gallery img, .photo-small")
    ).filter(function (img) {
        return img.getAttribute("src") && !img.closest("a");
    });

    if (photos.length > 0 && typeof HTMLDialogElement !== "undefined") {
        const dialog = document.createElement("dialog");
        dialog.className = "image-lightbox";
        dialog.setAttribute("aria-label", "Image viewer");

        dialog.innerHTML = `
            <button type="button" class="lightbox-close" aria-label="Close image viewer">&times;</button>
            <div class="lightbox-stage">
                <button type="button" class="lightbox-arrow lightbox-prev" aria-label="Previous image">&#8249;</button>
                <figure class="lightbox-figure">
                    <div class="lightbox-frame">
                        <img class="lightbox-image" alt="">
                    </div>
                    <figcaption class="lightbox-caption"></figcaption>
                </figure>
                <button type="button" class="lightbox-arrow lightbox-next" aria-label="Next image">&#8250;</button>
            </div>
            <p class="lightbox-count" role="status" aria-live="polite"></p>
            <p class="lightbox-hint">Use the arrow keys or swipe to browse. Click the photo to zoom. Press Esc to close.</p>
        `;

        document.body.appendChild(dialog);

        const largeImage = dialog.querySelector(".lightbox-image");
        const caption = dialog.querySelector(".lightbox-caption");
        const count = dialog.querySelector(".lightbox-count");
        const prevButton = dialog.querySelector(".lightbox-prev");
        const nextButton = dialog.querySelector(".lightbox-next");
        const closeButton = dialog.querySelector(".lightbox-close");
        let current = 0;
        let lastTrigger = null;
        let zoomed = false;

        if (photos.length === 1) {
            prevButton.hidden = true;
            nextButton.hidden = true;
        }

        function setZoom(on, event) {
            zoomed = on;
            dialog.classList.toggle("is-zoomed", on);
            if (on && event) {
                const box = largeImage.getBoundingClientRect();
                const x = ((event.clientX - box.left) / box.width) * 100;
                const y = ((event.clientY - box.top) / box.height) * 100;
                largeImage.style.transformOrigin = x + "% " + y + "%";
            } else if (!on) {
                largeImage.style.transformOrigin = "center";
            }
        }

        function captionFor(img) {
            const figure = img.closest("figure");
            const text = figure && figure.querySelector("figcaption");
            return (text && text.textContent.trim()) || img.alt || "Feline Faux photograph";
        }

        function preload(index) {
            const next = photos[(index + photos.length) % photos.length];
            new Image().src = next.dataset.full || next.currentSrc || next.src;
        }

        function showPhoto(index) {
            current = (index + photos.length) % photos.length;
            const img = photos[current];

            setZoom(false);
            dialog.classList.add("is-loading");
            largeImage.onload = function () {
                dialog.classList.remove("is-loading");
                // small source files are scaled up so the "larger view" really is larger
                dialog.classList.toggle("is-small", largeImage.naturalWidth < 600);
            };
            largeImage.onerror = function () {
                dialog.classList.remove("is-loading");
                caption.textContent = "Sorry, this image could not be loaded.";
            };
            // optional: add data-full="path/to/bigger-image.jpg" on an <img> to show a high-resolution version
            largeImage.src = img.dataset.full || img.currentSrc || img.src;
            largeImage.alt = img.alt || "";
            caption.textContent = captionFor(img);
            count.textContent = "Image " + (current + 1) + " of " + photos.length;

            preload(current + 1);
            preload(current - 1);
        }

        function openAt(index, trigger) {
            lastTrigger = trigger;
            showPhoto(index);
            if (!dialog.open) {
                dialog.showModal();
                document.body.classList.add("lightbox-open");
            }
            closeButton.focus();
        }

        function closeBox() {
            if (dialog.open) { dialog.close(); }
        }

        dialog.addEventListener("close", function () {
            document.body.classList.remove("lightbox-open");
            setZoom(false);
            if (lastTrigger) { lastTrigger.focus(); }
        });

        closeButton.addEventListener("click", closeBox);
        prevButton.addEventListener("click", function () { showPhoto(current - 1); });
        nextButton.addEventListener("click", function () { showPhoto(current + 1); });

        // click the dark area around the picture to close
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog ||
                event.target.classList.contains("lightbox-stage") ||
                event.target.classList.contains("lightbox-figure") ||
                event.target.classList.contains("lightbox-frame")) {
                closeBox();
            }
        });

        // click the picture to zoom in and out
        largeImage.addEventListener("click", function (event) {
            setZoom(!zoomed, event);
        });

        // keyboard: arrows, Home and End (Esc is handled by the dialog itself)
        dialog.addEventListener("keydown", function (event) {
            if (event.key === "ArrowLeft") { event.preventDefault(); showPhoto(current - 1); }
            if (event.key === "ArrowRight") { event.preventDefault(); showPhoto(current + 1); }
            if (event.key === "Home") { event.preventDefault(); showPhoto(0); }
            if (event.key === "End") { event.preventDefault(); showPhoto(photos.length - 1); }
        });

        // touch: swipe left or right to change image
        let touchStartX = null;
        dialog.addEventListener("touchstart", function (event) {
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });
        dialog.addEventListener("touchend", function (event) {
            if (touchStartX === null || zoomed) { touchStartX = null; return; }
            const distance = event.changedTouches[0].clientX - touchStartX;
            touchStartX = null;
            if (Math.abs(distance) > 50 && photos.length > 1) {
                showPhoto(distance > 0 ? current - 1 : current + 1);
            }
        }, { passive: true });

        photos.forEach(function (img, index) {
            img.tabIndex = 0;
            img.setAttribute("role", "button");
            img.setAttribute("aria-label", "Enlarge image: " + (img.alt || "Site photograph"));
            img.classList.add("lightbox-trigger");

            img.addEventListener("click", function () { openAt(index, img); });
            img.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openAt(index, img);
                }
            });
        });
    }

    // adding expandable details to service cards
    document.querySelectorAll(".service-card").forEach(function (card) {
        const paragraphs = Array.from(card.querySelectorAll("p"));

        if (paragraphs.length > 1) {
            const extraParagraphs = paragraphs.slice(1);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "details-toggle";
            button.setAttribute("aria-expanded", "false");
            button.textContent = "Read more +";

            extraParagraphs.forEach(function (paragraph) {
                paragraph.hidden = true;
            });

            button.addEventListener("click", function () {
                const expanded =
                    button.getAttribute("aria-expanded") === "true";

                button.setAttribute(
                    "aria-expanded",
                    String(!expanded)
                );

                extraParagraphs.forEach(function (paragraph) {
                    paragraph.hidden = expanded;
                });

                button.textContent = expanded
                    ? "Read more +"
                    : "Show less −";
            });

            card.appendChild(button);
        }
    });

    // responsive navigation toggle
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".nav-links");
    if (toggle && menu) {
        toggle.addEventListener("click", function () {
            const open = menu.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
        });
    }

    // interactive maps (Leaflet) for the two offices
    const offices = [
        { id: "map-pretoria", name: "Pretoria Office", pos: [-25.7479, 28.2293] },
        { id: "map-capetown", name: "Cape Town Office", pos: [-33.9249, 18.4241] }
    ];

    offices.forEach(function (o) {
        const el = document.getElementById(o.id);
        if (!el) { return; }

        if (typeof L === "undefined") {
            el.innerHTML = "<p>The interactive map could not load. " +
                "Check your internet connection or use the Google Maps link below.</p>";
            return;
        }

        const map = L.map(o.id, { scrollWheelZoom: false }).setView(o.pos, 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);
        L.marker(o.pos).addTo(map)
            .bindPopup("<strong>Feline Faux</strong><br>" + o.name);

        window.addEventListener("load", function () { map.invalidateSize(); });
    });

    // form validation rules: each returns "" when valid, or an error message
    const RECIPIENT = "felinefauxorg@gmail.com";
    const rules = {
        name: function (v) {
            if (v.length < 2) { return "Enter your full name (at least 2 characters)."; }
            return /^[A-Za-z\u00C0-\u024F' -]+$/.test(v) ? "" :
                "Names can only contain letters, spaces, hyphens and apostrophes.";
        },
        email: function (v) {
            if (!v) { return "Enter your email address."; }
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" :
                "Enter a valid email address, like name@example.com.";
        },
        phone: function (v) {
            return !v || /^(\+27|0)[1-9]\d{8}$/.test(v.replace(/[\s-]/g, "")) ? "" :
                "Enter a South African number, like 012 345 6789 or +27 12 345 6789.";
        },
        subject: function (v) { return v.length < 3 ? "Enter a subject (at least 3 characters)." : ""; },
        message: function (v) {
            if (v.length < 10) { return "Your message needs at least 10 characters."; }
            return v.length > 1500 ? "Keep your message under 1500 characters." : "";
        },
        messageType: function (v) { return v ? "" : "Choose a message type."; },
        enquiryType: function (v) { return v ? "" : "Choose an enquiry type."; },
        groupSize: function (v) {
            const n = Number(v);
            return !v || (Number.isInteger(n) && n >= 1 && n <= 500) ? "" :
                "Enter a whole number between 1 and 500.";
        },
        preferredDate: function (v) {
            return !v || new Date(v) >= new Date(new Date().toDateString()) ? "" :
                "Choose today's date or a future date.";
        }
    };

    function esc(text) {
        const d = document.createElement("div");
        d.textContent = text;
        return d.innerHTML;
    }

    function checkField(field) {
        const message = rules[field.name](field.value.trim());
        const id = field.id + "-error";
        let box = document.getElementById(id);
        if (!box) {
            box = document.createElement("p");
            box.id = id;
            box.className = "field-error";
            field.parentNode.appendChild(box);
        }
        box.textContent = message;
        field.setAttribute("aria-invalid", message ? "true" : "false");
        field.setAttribute("aria-describedby", id);
        return !message;
    }

    // enquiry response: cost and availability for each enquiry type

    function enquiryReply(type, size, date) {
        const people = Number(size) || 0;
        const when = date ? new Date(date).toLocaleDateString("en-ZA",
            { day: "numeric", month: "long", year: "numeric" }) : "";
        const replies = {
            "Volunteer": ["Volunteer with us",
                "Volunteering is free. We cover training and materials.",
                "Orientation runs on the first Saturday of every month in Pretoria and Cape Town" +
                (when ? ". We will confirm a place for " + when + "." : ".")],
            "Sponsorship": ["Sponsor our work",
                "Supporter R250 a month, Champion R1 000 a month, Guardian R5 000 a month. Business sponsors get their logo on this website.",
                "Sponsorship places are open all year round."],
            "Education": ["Book an education talk",
                people > 50 ?
                    "R" + (1500 + (people - 50) * 25).toLocaleString("en-ZA") + " for " + people + " people (R1 500 for the first 50, then R25 each)." :
                    "R1 500 for a talk of up to 50 people.",
                "Talks run on weekdays and need two weeks' notice" + (when ? ". We will check " + when + "." : ".")],
            "Campaign": ["Join an awareness campaign",
                "Joining a campaign is free.",
                "A new campaign starts every quarter."],
            "Product or ethical alternatives": ["Ethical alternatives",
                "Our guides and consultations are free.",
                "Consultations run Monday to Friday, 09:00 to 16:00."]
        };
        return replies[type] || ["We have your enquiry",
            "We will confirm any costs once we understand your request.",
            "We reply within three working days."];
    }

    // validate, then process the enquiry or contact form
    document.querySelectorAll("form[data-form-purpose]").forEach(function (form) {
        form.noValidate = true;
        const fields = Array.from(form.elements).filter(function (f) {
            return rules[f.name];
        });

        fields.forEach(function (f) {
            f.addEventListener("blur", function () { checkField(f); });
            f.addEventListener("input", function () {
                if (f.getAttribute("aria-invalid") === "true") { checkField(f); }
            });
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const feedback = form.querySelector(".form-feedback");
            const invalid = fields.filter(function (f) { return !checkField(f); });

            if (invalid.length > 0) {
                feedback.textContent = "Please fix the " + invalid.length +
                    " field(s) marked in red.";
                invalid[0].focus();
                return;
            }

            const data = new FormData(form);
            const isEnquiry = form.dataset.formPurpose === "enquiry";
            const type = data.get("enquiryType") || data.get("messageType");
            const lines = [
                "Type: " + type,
                "Name: " + data.get("name").trim(),
                "Email: " + data.get("email").trim(),
                "Phone: " + (data.get("phone") || "Not given"),
                "Subject: " + data.get("subject").trim()
            ];
            let panelHtml;

            if (isEnquiry) {
                const reply = enquiryReply(type, data.get("groupSize"), data.get("preferredDate"));
                lines.push("People: " + (data.get("groupSize") || "Not given"),
                    "Preferred date: " + (data.get("preferredDate") || "Not given"));
                panelHtml = "<h3>" + esc(reply[0]) + "</h3>" +
                    "<p><strong>Cost:</strong> " + esc(reply[1]) + "</p>" +
                    "<p><strong>Availability:</strong> " + esc(reply[2]) + "</p>" +
                    "<p>Send your enquiry so our team can confirm the details.</p>";
            } else {
                panelHtml = "<h3>Your message is ready</h3>" +
                    "<p><strong>To:</strong> " + esc(RECIPIENT) + "<br><strong>Type:</strong> " +
                    esc(type) + "<br><strong>Subject:</strong> " + esc(data.get("subject").trim()) + "</p>" +
                    "<p>Press the button to open it in your email app, then send it.</p>";
            }

            lines.push("", "Message:", data.get("message").trim());

            const link = document.createElement("a");
            link.className = "button";
            link.textContent = isEnquiry ? "Send enquiry by email" : "Open email draft";
            link.href = "mailto:" + RECIPIENT + "?subject=" +
                encodeURIComponent("[Feline Faux] " + data.get("subject").trim()) +
                "&body=" + encodeURIComponent(lines.join("\n"));

            const old = form.querySelector(".form-result");
            if (old) { old.remove(); }

            const panel = document.createElement("div");
            panel.className = "form-result";
            panel.tabIndex = -1;
            panel.innerHTML = panelHtml;
            panel.appendChild(link);
            form.appendChild(panel);

            feedback.textContent = "Thank you. Your details are valid.";
            panel.focus();
        });
    });

});
