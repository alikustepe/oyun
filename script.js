const engine = {
    gameLoop: null,

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    showMenu() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        this.showScreen('menu-screen');
    },

    win() {
        setTimeout(() => this.showScreen('letter-screen'), 800);
    },

    loadGame(type) {
        const container = document.getElementById('game-container');
        const ui = document.getElementById('score-display');
        const tip = document.getElementById('game-tip');
        container.innerHTML = '';
        this.showScreen('game-screen');

        if (type === 'runner') this.startRunner(container, ui, tip);
        if (type === 'catcher') this.startCatcher(container, ui, tip);
        if (type === 'memory') this.startMemory(container, ui, tip);
        if (type === 'shuffle') this.startShuffle(container, ui, tip);
    },
    // 1. RUNNER (KOŞUCU) - Kelebek ve Kalpler Versiyonu
    startRunner(cont, ui, tip) {
        tip.innerText = "Kelebeği uçurmak için dokun! Hedef: 10";

        const canvas = document.createElement('canvas');
        cont.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = cont.clientWidth;
        canvas.height = cont.clientHeight;

        let score = 0;
        let dino = {
            x: 50,
            y: canvas.height - 70,
            w: 40,
            h: 40,
            dy: 0,
            jump: -12,     // Yumuşak uçuş
            grav: 0.5,     // Hafif süzülme
            grounded: true
        };

        let obstacles = [];
        let frame = 0;
        let speed = 8;

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Fizik motoru
            dino.dy += dino.grav;
            dino.y += dino.dy;

            // Yer kontrolü (Zemin çizgisi)
            if (dino.y + dino.h > canvas.height - 20) {
                dino.y = canvas.height - 20 - dino.h;
                dino.dy = 0;
                dino.grounded = true;
            }

            // Engel (Kalpler) oluşturma - Daha seyrek ve zarif
            if (frame++ % 120 === 0) {
                obstacles.push({
                    x: canvas.width,
                    y: canvas.height - 55, // Kalpler zeminde dursun
                    w: 30,
                    h: 30
                });
            }

            // Engelleri (Kalpleri) hareket ettir ve çiz
            obstacles.forEach((o, i) => {
                o.x -= speed;

                // ENGEL ÇİZİMİ: Kalp ❤️
                ctx.font = "30px serif";
                ctx.fillText("❤️", o.x, o.y + o.h);

                // Çarpışma kontrolü
                if (
                    dino.x < o.x + o.w &&
                    dino.x + dino.w > o.x &&
                    dino.y < o.y + o.h &&
                    dino.y + dino.h > o.y
                ) {
                    score = 0;
                    obstacles = [];
                    ui.innerText = "Puan: 0";
                }

                // Skor ve temizleme
                if (o.x + o.w < 0) {
                    obstacles.splice(i, 1);
                    score++;
                    ui.innerText = `Puan: ${score} / 10`;
                    if (score % 5 === 0) speed += 0.3;
                }
            });

            // KARAKTER ÇİZİMİ: Kelebek 🦋
            ctx.font = "40px serif";
            // Kelebek kanat çırpma efekti (hafif yukarı aşağı sallanma)
            let wingFlap = Math.sin(frame * 0.2) * 3;
            ctx.fillText("🦋", dino.x, dino.y + dino.h + wingFlap);

            if (score >= 10) this.win();
            else this.gameLoop = requestAnimationFrame(loop);
        };

        canvas.onclick = () => {
            if (dino.grounded || dino.dy > 0) { // Havada da küçük bir süzülme desteği
                dino.dy = dino.jump;
                dino.grounded = false;
            }
        };

        loop();
    },


    // 2. CATCHER (YAKALAYICI)
    startCatcher(cont, ui, tip) {

        tip.innerText = "Parmağınla kalpleri yakala! Hedef: 10";

        const canvas = document.createElement('canvas');
        cont.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = cont.clientWidth;
        canvas.height = cont.clientHeight;

        let score = 0;
        let basketX = canvas.width / 2;
        let hearts = [];

        const loop = () => {

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 🔥 kalpler daha seyrek üretiliyor
            if (Math.random() < 0.05) {
                hearts.push({
                    x: Math.random() * (canvas.width - 20),
                    y: 0,
                    s: 3.5    // 🔥 daha yavaş düşüş
                });
            }

            hearts.forEach((h, i) => {

                h.y += h.s;

                ctx.font = "28px Arial";
                ctx.fillText("❤️", h.x, h.y);

                if (
                    h.y > canvas.height - 40 &&
                    h.x > basketX - 40 &&
                    h.x < basketX + 40
                ) {
                    hearts.splice(i, 1);
                    score++;
                    ui.innerText = `Kalpler: ${score} / 10`;
                }

                if (h.y > canvas.height) {
                    hearts.splice(i, 1);
                }
            });

            ctx.fillStyle = "#ff477e";
            ctx.fillRect(basketX - 40, canvas.height - 20, 80, 10);

            if (score >= 10) this.win();
            else this.gameLoop = requestAnimationFrame(loop);
        };

        const move = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            basketX = clientX - rect.left;
        };

        canvas.onmousemove = move;
        canvas.ontouchmove = (e) => { move(e); e.preventDefault(); };

        loop();
    },


    // 3. MEMORY (HAFIZA)
    startMemory(cont, ui, tip) {
        tip.innerText = "Aynı olanları bul!";
        const icons = ['❤️', '💖', '🌹', '⭐', '🦋', '🎁'];
        const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
        const grid = document.createElement('div');
        grid.className = 'memory-grid';
        let flipped = [], matches = 0;

        deck.forEach(icon => {
            const card = document.createElement('div');
            card.className = 'card'; card.innerText = '?';
            card.onclick = () => {
                if (flipped.length < 2 && !card.classList.contains('flipped')) {
                    card.classList.add('flipped'); card.innerText = icon;
                    flipped.push(card);
                    if (flipped.length === 2) {
                        if (flipped[0].innerText === flipped[1].innerText) {
                            matches++; flipped = [];
                            ui.innerText = `Eşleşme: ${matches} / 6`;
                            if (matches === 6) this.win();
                        } else {
                            setTimeout(() => { flipped.forEach(c => { c.classList.remove('flipped'); c.innerText = '?'; }); flipped = []; }, 600);
                        }
                    }
                }
            };
            grid.appendChild(card);
        });
        cont.appendChild(grid);
    },

    // 4. SHUFFLE (KUTU)
    startShuffle(cont, ui, tip) {
        tip.innerText = "Kalbin olduğu kutuyu takip et!";
        cont.innerHTML = `<div class="box-area">
            <div class="box" id="bx0" style="left: calc(50% - 130px)">?</div>
            <div class="box" id="bx1" style="left: calc(50% - 40px)">?</div>
            <div class="box" id="bx2" style="left: calc(50% + 50px)">?</div>
        </div><button class="btn-primary" id="start-shf" style="position:absolute; bottom:20px">Başlat</button>`;

        const boxes = [document.getElementById('bx0'), document.getElementById('bx1'), document.getElementById('bx2')];
        const heartIdx = Math.floor(Math.random() * 3);
        let canClick = false;

        document.getElementById('start-shf').onclick = (e) => {
            e.target.style.display = 'none';
            boxes[heartIdx].innerText = '❤️';
            setTimeout(() => {
                boxes[heartIdx].innerText = '?';
                let moves = 0;
                const int = setInterval(() => {
                    const i1 = Math.floor(Math.random() * 3);
                    const i2 = Math.floor(Math.random() * 3);
                    const tmp = boxes[i1].style.left;
                    boxes[i1].style.left = boxes[i2].style.left;
                    boxes[i2].style.left = tmp;
                    if (moves++ > 10) {
                        clearInterval(int); canClick = true;
                        boxes.forEach((b, i) => b.onclick = () => {
                            if (!canClick) return;
                            b.innerText = (i === heartIdx) ? '❤️' : '❌';
                            if (i === heartIdx) engine.win();
                            else setTimeout(() => engine.loadGame('shuffle'), 1000);
                        });
                    }
                }, 400);
            }, 1000);
        };
    }

};


