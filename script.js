    /* --- AUDIO SYSTEM --- */
    const audioCtx = new(window
      .AudioContext || window
      .webkitAudioContext)();
    
    const SoundFX = {
      
      getVol: (x, y) => {
        if (x === null || y ===
          null)
          return 1.0;
        
        const dist = Math.hypot(x -
          player.x, y - player.y);
        const maxDist =
          2000;
        
        let vol = 1 - (dist /
          maxDist);
        return Math.max(0,
          vol
        );
      },
      
      shoot: (x = null, y = null) => {
        if (audioCtx.state ===
          'suspended') audioCtx
          .resume();
        
        const vol = SoundFX.getVol(
          x, y);
        if (vol <= 0)
          return;
        
        const bufferSize = audioCtx
          .sampleRate * 0.5;
        const buffer = audioCtx
          .createBuffer(1,
            bufferSize, audioCtx
            .sampleRate);
        const data = buffer
          .getChannelData(0);
        
        for (let i = 0; i <
          bufferSize; i++) {
          data[i] = Math.random() *
            2 - 1;
        }
        
        const noise = audioCtx
          .createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx
          .createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency
          .setValueAtTime(1000,
            audioCtx.currentTime);
        filter.frequency
          .exponentialRampToValueAtTime(
            50, audioCtx
            .currentTime + 0.3);
        
        const gain = audioCtx
          .createGain();
        // Base volume is 2.5, multiplied by our distance factor
        gain.gain.setValueAtTime(
          2.5 * vol, audioCtx
          .currentTime);
        gain.gain
          .exponentialRampToValueAtTime(
            0.01, audioCtx
            .currentTime + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx
          .destination);
        noise.start();
      },
      
      hit: (x = null, y = null) => {
        if (audioCtx.state ===
          'suspended') audioCtx
          .resume();
        
        const vol = SoundFX.getVol(
          x, y);
        if (vol <= 0) return;
        
        const t = audioCtx
          .currentTime;
        const freqs = [800, 2240,
          3600
        ];
        
        freqs.forEach((f, i) => {
          const osc = audioCtx
            .createOscillator();
          const gain = audioCtx
            .createGain();
          
          osc.type = i === 1 ?
            'triangle' : 'sine';
          osc.frequency
            .setValueAtTime(f,
              t);
          
          const baseVol = i ===
            0 ? 0.1 : 0.025;
          gain.gain
            .setValueAtTime(
              baseVol * vol, t);
          gain.gain
            .exponentialRampToValueAtTime(
              0.001, t + 0.15);
          
          osc.connect(gain);
          gain.connect(audioCtx
            .destination);
          osc.start();
          osc.stop(t + 0.15);
        });
      },
      
      explode: () => {
        // Explosion is always loud (global event)
        if (audioCtx.state ===
          'suspended') audioCtx
          .resume();
        const t = audioCtx
          .currentTime;
        
        // ... (Your existing explode logic remains the same) ...
        const osc = audioCtx
          .createOscillator();
        const oscGain = audioCtx
          .createGain();
        osc.type = 'sawtooth';
        osc.frequency
          .setValueAtTime(60, t);
        osc.frequency
          .exponentialRampToValueAtTime(
            10, t + 1.2);
        oscGain.gain.setValueAtTime(
          3.0, t);
        oscGain.gain
          .exponentialRampToValueAtTime(
            0.01, t + 1.2);
        osc.connect(oscGain);
        oscGain.connect(audioCtx
          .destination);
        osc.start();
        osc.stop(t + 1.2);
        
        const bufferSize = audioCtx
          .sampleRate * 1.5;
        const buffer = audioCtx
          .createBuffer(1,
            bufferSize, audioCtx
            .sampleRate);
        const data = buffer
          .getChannelData(0);
        for (let i = 0; i <
          bufferSize; i++) data[i] =
          Math.random() * 2 - 1;
        const noise = audioCtx
          .createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx
          .createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency
          .setValueAtTime(600, t);
        const nGain = audioCtx
          .createGain();
        nGain.gain.setValueAtTime(
          2.5, t);
        nGain.gain
          .exponentialRampToValueAtTime(
            0.01, t + 1.2);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(audioCtx
          .destination);
        noise.start();
      },
      rockBreak: (x, y) => {
        if (audioCtx.state ===
          'suspended') audioCtx
          .resume();
        const vol = SoundFX.getVol(
          x, y);
        if (vol <= 0) return;
        
        const t = audioCtx
          .currentTime;
        const bufferSize = audioCtx
          .sampleRate * 0.4;
        const buffer = audioCtx
          .createBuffer(1,
            bufferSize, audioCtx
            .sampleRate);
        const data = buffer
          .getChannelData(0);
        for (let i = 0; i <
          bufferSize; i++) data[i] =
          Math.random() * 2 - 1;
        
        const noise = audioCtx
          .createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx
          .createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency
          .setValueAtTime(400, t);
        filter.frequency
          .exponentialRampToValueAtTime(
            50, t + 0.3);
        
        const gain = audioCtx
          .createGain();
        gain.gain.setValueAtTime(
          1.5 * vol, t);
        gain.gain
          .exponentialRampToValueAtTime(
            0.01, t + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx
          .destination);
        noise.start();
      },
      
    };
    
    
    /* --- CONFIG & STATE --- */
    const canvas = document
      .getElementById(
        'gameCanvas');
    const ctx = canvas.getContext(
      '2d');
    const ui = document
      .getElementById('ui-layer');
    let powerups = [];
    let peer, conn, localStream;
    let isHost = false,
      gameActive = false,
      isGameOver = false;
    let worldSize = {
      w: 2400,
      h: 2400
    };
    let obstacles = [],
      particles = [],
      shockwaves = [];
    let myRematchReq = false,
      oppRematchReq = false;
    
    const FIRE_DELAY = 700;
    const RELOAD_TIME = 3000;
    const MAX_AMMO = 5;
    // TANK DIMENSIONS
    const TANK_W = 50;
    const TANK_H = 40;
    
    const player = {
      x: 0,
      y: 0,
      angle: 0,
      turretAngle: 0, // NEW: Tracks the nozzle direction
      hp: 100,
      ammo: MAX_AMMO,
      bullets: [],
      lastFire: 0,
      lastReload: 0,
      color: '#4caf50',
      shieldUntil: 0,
      unlimitedUntil: 0,
      hasMissile: false
    };
    
    const enemy = {
      x: -1000,
      y: -1000,
      angle: 0,
      turretAngle: 0, // NEW: Tracks enemy nozzle direction
      hp: 100,
      bullets: [],
      color: '#f44336',
      dead: false,
      shieldActive: false,
      unlimitedActive: false,
      hasMissile: false
    };
    
    const keys = {};
    
    /* --- INITIALIZATION --- */
    let groundPattern;
    
    function createGround() {
      const off = document
        .createElement(
          'canvas');
      off.width = 200;
      off.height = 200;
      const octx = off.getContext(
        '2d');
      octx.fillStyle = '#3a4d2c';
      octx.fillRect(0, 0, 200,
        200);
      for (let i = 0; i <
        300; i++) {
        octx.fillStyle =
          `rgba(40, 60, 20, ${Math.random()*0.4})`;
        octx.fillRect(Math
          .random() * 200,
          Math.random() *
          200, 2, 5);
      }
      for (let i = 0; i <
        40; i++) {
        octx.fillStyle = Math
          .random() > 0.5 ?
          '#6b5b45' :
          '#7a7a7a';
        octx.beginPath();
        octx.arc(Math.random() *
          200, Math
          .random() * 200,
          Math.random() *
          3 + 1, 0, Math
          .PI * 2);
        octx.fill();
      }
      groundPattern = ctx
        .createPattern(off,
          'repeat');
    }
    
    /* --- NETWORKING --- */
    function showHost() {
      document.getElementById(
          'menu-main').style
        .display = 'none';
      document.getElementById(
          'menu-host').style
        .display = 'block';
      isHost = true;
      initPeer(Math.floor(100000 +
          Math.random() *
          900000)
        .toString());
    }
    
    function initPeer(id) {
      if (peer) peer.destroy();
      peer = new Peer(id);
      peer.on('open', (id) => {
        document
          .getElementById(
            'code-display'
          )
          .innerText =
          id;
      });
      peer.on('connection', (
        c) => {
        conn = c;
        if (isHost) {
          document
            .getElementById(
              'host-status'
            )
            .innerText =
            "Generating World...";
          conn.on('open',
            () => {
              genWorld
                ();
              const
                hostSpawn =
                getSafeSpawn(
                  null
                );
              resetPlayer
                (hostSpawn
                  .x,
                  hostSpawn
                  .y
                );
              const
                joinSpawn =
                getSafeSpawn(
                  hostSpawn
                );
              conn.send({
                type: 'init',
                world: obstacles,
                startX: joinSpawn
                  .x,
                startY: joinSpawn
                  .y
              });
              start
                ();
              setupAudio
                ();
            });
          setupConn();
        }
      });
      peer.on('call', (c) => {
        c.answer(
          localStream
        );
        c.on('stream',
          rs => {
            const
              audioEl =
              document
              .getElementById(
                'remote-audio'
              );
            audioEl
              .srcObject =
              rs;
            audioEl
              .play()
              .catch(
                e =>
                console
                .log(
                  "Audio play error:",
                  e
                )
              );
          });
      });
      peer.on('disconnected',
        handleOpponentDisconnect
      );
    }
    
    function joinGame() {
      const id = document
        .getElementById(
          'join-id').value;
      if (id.length < 6) return;
      isHost = false;
      document.getElementById(
          'btn-join')
        .innerText =
        "CONNECTING...";
      if (peer) peer.destroy();
      peer = new Peer();
      peer.on('open', () => {
        conn = peer
          .connect(
            id);
        setupConn();
      });
      peer.on('call', (c) => {
        c.answer(
          localStream
        );
        c.on('stream',
          rs => {
            document
              .getElementById(
                'remote-audio'
              )
              .srcObject =
              rs;
          });
      });
    }
    
    function setupConn() {
      conn.on('data', d => {
        
        // Inside setupConn(), look for d.type === 'init'
        if (d.type === 'init') {
          obstacles = d.world;
          resetPlayer(d.startX, d
            .startY);
          resetGameParams
        (); // This is the key call
          start();
          setupAudio();
        }
        
        
        
        if (d.type ===
          'spawn_powerup') powerups
          .push(d.p);
        if (d.type ===
          'pickup_powerup')
          powerups = powerups
          .filter(p => p.id !== d
            .id);
        if (d.type === 'rock_hit') {
          damageRock(d.id, d.dmg, d
            .bx, d.by, false
          ); // false = not local, prevents infinite loop
        }
        
        if (d.type === 'hit') {
          takeDamage(d
            .dmg
          ); // Modified to accept dynamic damage
          SoundFX.hit(player.x,
            player.y);
        }
        
        if (d.type === 'update') {
          enemy.targetX = d.x;
          enemy.targetY = d.y;
          enemy.x += (enemy
              .targetX - enemy.x) *
            0.2;
          enemy.y += (enemy
              .targetY - enemy.y) *
            0.2;
          
          enemy.angle = d.angle;
          enemy.turretAngle = d
            .turretAngle
          enemy.bullets = d.b;
          if (!enemy.dead) enemy
            .hp = d.hp;
          
          enemy.shieldActive = d
            .buffs.s;
          enemy.unlimitedActive = d
            .buffs.u;
          enemy.hasMissile = d.buffs
            .m;
          
          
        }
        
        if (d.type === 'fire') {
          SoundFX.shoot(d.x, d.y);
        }
        
        if (d.type === 'hit') {
          takeDamage(10);
          SoundFX.hit(player.x,
            player.y);
        }
        
        if (d.type === 'died')
          killEnemy();
        
        if (d.type ===
          'rematch_req') {
          oppRematchReq = true;
          checkRematch();
        }
        
        if (d.type === 'quit')
          handleOpponentDisconnect();
      });
      
      conn.on('close',
        handleOpponentDisconnect);
      conn.on('error', (err) => console
        .log("Conn Error: " + err));
    }
    
    
    function handlePowerups() {
      const now = Date.now();
      
      if (isHost && powerups.length <
        4 && Math.random() < 0.005) {
        const pool = ['heal',
          'shield',
          'unlimited', 'missile'
        ];
        const type = pool[Math.floor(
          Math.random() * pool
          .length)];
        const spawn =
          getSafePowerupSpawn();
        
        if (spawn) {
          const newPowerup = {
            id: now,
            x: spawn.x,
            y: spawn.y,
            type: type
          };
          powerups.push(newPowerup);
          if (conn) conn
            .send({
              type: 'spawn_powerup',
              p: newPowerup
            });
        }
      }
      
      
      
      for (let i = powerups.length -
          1; i >= 0; i--) {
        let p = powerups[i];
        if (Math.hypot(player.x - p.x,
            player.y - p.y) < 25 +
          15
        ) {
          applyPowerup(p.type);
          if (conn) conn
            .send({
              type: 'pickup_powerup',
              id: p.id
            });
          powerups.splice(i, 1);
        }
      }
    }
    
    function applyPowerup(type) {
      const now = Date.now();
      const overlay = document
        .getElementById(
          'damage-overlay');
      
      if (type === 'heal') {
        player.hp = Math.min(100, player
          .hp + 30);
        overlay.classList.remove(
          'damage-active')
        overlay.classList.remove(
          'heal-active');
        void overlay
          .offsetWidth;
        overlay.classList.add(
          'heal-active');
        
      }
      
      if (type === 'shield') player
        .shieldUntil = now + 6000;
      if (type === 'unlimited') {
        player.unlimitedUntil = now +
          5000;
        player.ammo = 5
      }
      if (type === 'missile') player
        .hasMissile = true;
      updateHUD();
    }
    
    
    function setupAudio() {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(s => {
          localStream = s;
          localStream
            .getAudioTracks()[
              0]
            .enabled =
            false;
          if (conn && conn
            .peer) {
            const c =
              peer
              .call(
                conn
                .peer,
                s);
            c.on('stream',
              rs => {
                document
                  .getElementById(
                    'remote-audio'
                  )
                  .srcObject =
                  rs;
              });
          }
        })
        .catch(e => {
          console.log(
            "Mic Denied/Unavailable. Listener mode only."
          );
          localStream =
            null;
        });
    }
    
    function toggleMic() {
      if (!localStream) {
        alert(
          "Microphone access was denied or not found."
        );
        return;
      }
      const track = localStream
        .getAudioTracks()[0];
      track.enabled = !track
        .enabled;
      document.getElementById(
          'mic-btn').classList
        .toggle('on', track
          .enabled);
    }
    
    /* --- WORLD & SPAWN LOGIC --- */
    function genWorld() {
      obstacles = [];
      for (let i = 0; i <
        35; i++) {
        const r = 40 + Math
          .random() * 50;
        const pts = [];
        const segs = 6 + Math
          .floor(Math
            .random() * 4);
        for (let s = 0; s <
          segs; s++) {
          const a = (s /
              segs) * Math
            .PI * 2;
          const dist = r * (
            0.8 + Math
            .random() *
            0.4);
          pts.push({
            x: Math
              .cos(
                a
              ) *
              dist,
            y: Math
              .sin(
                a
              ) *
              dist
          });
        }
        
        obstacles.push({
          id: i, // NEW: Unique ID for networking
          x: Math.random() *
            worldSize.w,
          y: Math.random() *
            worldSize.h,
          r: r,
          maxHp: Math.floor(r *
            1.5
          ), // NEW: Bigger rocks have more HP
          hp: Math.floor(r *
            1.5), // NEW: Current HP
          pts: pts,
          color: '#555'
        });
        
      }
    }
    
    function damageRock(id, dmg, bx, by,
      isLocal = false) {
      let idx = obstacles.findIndex(o =>
        o.id === id);
      if (idx === -1) return;
      
      let o = obstacles[idx];
      o.hp -= dmg;
      
      // Send network update if we fired the bullet
      if (isLocal && conn) {
        conn.send({
          type: 'rock_hit',
          id: id,
          dmg: dmg,
          bx: bx,
          by: by
        });
      }
      
      // Spawn minor dust particles
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: bx,
          y: by,
          vx: (Math.random() -
            0.5) * 5,
          vy: (Math
            .random() - 0.5) * 5,
          l: 15,
          c: '#777'
        });
      }
      
      if (o.hp <= 0) {
        destroyRock(idx);
      } else {
        SoundFX.hit(bx, by);
        // Make the rock visually darker as it gets damaged
        const damagePercent = Math.max(
          0, o.hp / o.maxHp);
        const grayVal = Math.floor(40 +
          (45 * damagePercent));
        o.color =
          `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
      }
    }
    
    function destroyRock(idx) {
      let o = obstacles[idx];
      SoundFX.rockBreak(o.x, o.y);
      
      // Trigger slight camera shake
      document.body.classList.remove(
        'slight-shake-active');
      void document.body.offsetWidth;
      document.body.classList.add(
        'slight-shake-active');
      
      // Huge dust explosion
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: o.x,
          y: o.y,
          vx: (Math.random() -
            0.5) * 8,
          vy: (Math
            .random() - 0.5) * 8,
          l: 25,
          c: o.color
        });
      }
      
      // Remove the rock
      obstacles.splice(idx, 1);
    }
    
    function getSafeSpawn(
      avoidPoint) {
      let safe = false,
        x, y, attempts = 0;
      const minDistance = 1200;
      while (!safe && attempts <
        200) {
        attempts++;
        x = 100 + Math
          .random() * (
            worldSize
            .w - 200);
        y = 100 + Math
          .random() * (
            worldSize
            .h - 200);
        let isClean = true;
        if (checkCol(x, y, 60))
          isClean = false;
        if (avoidPoint &&
          isClean) {
          if (Math.hypot(x -
              avoidPoint
              .x, y -
              avoidPoint.y
            ) <
            minDistance)
            isClean = false;
        }
        if (isClean) safe =
          true;
      }
      if (!safe) {
        x = 200;
        y = 200;
      }
      return { x, y };
    }
    
    function handleQuit() {
      if (conn) {
        conn
          .send({ type: 'quit' });
        setTimeout(() => {
            conn
              .close();
          },
          100);
      }
      location.reload();
    }
    
    let disconnectTriggered = false;
    
    function handleOpponentDisconnect() {
      if (disconnectTriggered)
        return;
      disconnectTriggered = true;
      const modal = document
        .getElementById(
          'disconnect-modal');
      const msg = document
        .getElementById(
          'disconnect-msg');
      const cWin = document
        .getElementById(
          "checkWin")
      const timerEl = document
        .getElementById(
          'disconnect-timer');
      document.querySelectorAll(
          '.overlay-menu')
        .forEach(m => m.style
          .display = 'none');
      document.getElementById(
          'ui-layer').style
        .display = 'none';
      modal.style.display =
        'flex';
      if (!isGameOver) {
        msg.innerText =
          "MISSION SUCCESSFUL!";
        cWin.style.display =
          "block";
        msg.style.color =
          "#4caf50";
      } else {
        msg.innerText =
          "OPPONENT LEFT.";
        cWin.style.display =
          "none";
        msg.style.color =
          "#d32f2f";
      }
      let count = 3;
      timerEl.innerText = count;
      const interval =
        setInterval(() => {
          count--;
          timerEl
            .innerText =
            count;
          if (count <=
            0) {
            clearInterval
              (
                interval
              );
            location
              .reload();
          }
        }, 1000);
    }
    
    function requestRematch() {
      const btn = document
        .getElementById(
          'btn-rematch');
      btn.disabled = true;
      btn.innerText =
        "WAITING...";
      myRematchReq = true;
      if (conn) conn
        .send({ type: 'rematch_req' });
      checkRematch();
    }
    
    function checkRematch() {
      const msg = document
        .getElementById(
          'rematch-msg');
      if (oppRematchReq && !
        myRematchReq) {
        msg.innerText =
          "OPPONENT WANTS A REMATCH!";
        msg.style.animation =
          "pulse 1s infinite";
      }
      if (myRematchReq &&
        oppRematchReq) {
        resetGameParams();
        if (isHost) {
          genWorld();
          const hS =
            getSafeSpawn(
              null);
          resetPlayer(hS.x, hS
            .y);
          const jS =
            getSafeSpawn(
              hS);
          conn.send({
            type: 'init',
            world: obstacles,
            startX: jS
              .x,
            startY: jS
              .y
          });
          start();
        }
      }
    }
    
    function resetGameParams() {
      // Hide menus
      document.getElementById(
          'menu-over').style.display =
        'none';
      document.getElementById(
          'menu-main').style.display =
        'none';
      document.getElementById(
          'menu-host').style.display =
        'none';
      document.getElementById(
          'ui-layer').style.display =
        'block';
      ui.style.zIndex = 50;
      if (/Android|iPhone/i.test(
          navigator.userAgent)) {
        document.getElementById(
            'mobile-controls').style
          .display = 'block';
      }
      // Reset button states
      const btn = document
        .getElementById('btn-rematch');
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Rematch";
      }
      document.getElementById(
        'rematch-msg').innerText = "";
      
      // Reset game state
      enemy.hp = 100;
      enemy.dead = false;
      enemy.color = '#f44336';
      isGameOver = false;
      gameActive =
        true; // Ensure the loop keeps running
      myRematchReq = false;
      oppRematchReq = false;
      shockwaves = [];
      particles = [];
      
      updateHUD
        (); // Refresh bars immediately
    }
    
    
    /* --- GAMEPLAY --- */
    function resetPlayer(x, y) {
      player.x = x;
      player.y = y;
      player.hp = 100;
      player.color = '#4caf50';
      player.ammo = MAX_AMMO;
      player.angle = isHost ? 0 : Math
        .PI;
      player.lastReload = Date.now();
      updateHUD();
    }
    
    function start() {
      document.querySelectorAll(
          '.overlay-menu')
        .forEach(m => m.style
          .display = 'none');
      ui.style.display = 'block';
      if (/Android|iPhone/i.test(
          navigator.userAgent
        )) document
        .getElementById(
          'mobile-controls')
        .style.display =
        'block';
      if (!groundPattern)
        createGround();
      gameActive = true;
      isGameOver = false;
      if (audioCtx.state ===
        'suspended') audioCtx
        .resume();
      requestAnimationFrame(loop);
    }
    
    function takeDamage(v) {
      if (Date.now() < player
        .shieldUntil) return;
      player.hp -= v;
      const overlay = document
        .getElementById(
          'damage-overlay');
      overlay.classList.remove(
        'damage-active');
      void overlay.offsetWidth;
      overlay.classList.add(
        'damage-active');
      if (player.hp <= 0) {
        player.hp = 0;
        player.color = '#333333';
        updateHUD();
        conn.send({ type: 'died' });
        triggerBlast(player.x, player
          .y);
        setTimeout(() => {
          gameOver(false);
        }, 1500);
      } else {
        updateHUD();
      }
    }
    
    
    function killEnemy() {
      enemy.hp = 0;
      enemy.dead = true;
      enemy.color = '#333333';
      updateHUD();
      triggerBlast(enemy.x, enemy
        .y);
      setTimeout(() => {
          gameOver(
            true);
        },
        1500);
    }
    
    function triggerBlast(x, y) {
      SoundFX.explode();
      for (let i = 0; i <
        40; i++) {
        particles.push({
          x: x,
          y: y,
          vx: (Math
              .random() -
              0.5
            ) *
            15,
          vy: (Math
              .random() -
              0.5
            ) *
            15,
          l: 50,
          c: '#f40'
        });
      }
      shockwaves.push({
        x: x,
        y: y,
        r: 10,
        maxR: 200,
        alpha: 1
      });
      
      const gameEl = document
        .getElementById('gameCanvas');
      gameEl.classList.remove(
        'shake-effect');
      void gameEl.offsetWidth;
      gameEl.classList.add(
        'shake-effect');
    }
    
    function fireBullet(e) {
      if (e) e.preventDefault();
      const now = Date.now();
      const isUnlimited = now < player
        .unlimitedUntil;
      
      
      if (now - player.lastFire <
        FIRE_DELAY) return;
      
      
      if (!isUnlimited && player.ammo <=
        0) return;
      
      
      
      player.lastFire = now;
      
      
      if (!isUnlimited) {
        player.ammo--;
        player.lastReload = now;
      }
      
      SoundFX.shoot();
      
      if (conn) {
        conn.send({
          type: 'fire',
          x: player.x,
          y: player.y
        });
      }
      
      const isMissile = player
        .hasMissile;
      player.hasMissile = false;
      
      player.bullets.push({
        x: player.x + Math.cos(
            player.turretAngle) *
          35,
        y: player.y + Math.sin(
            player.turretAngle) *
          35,
        vx: Math.cos(player
          .turretAngle) * 15,
        vy: Math.sin(player
          .turretAngle) * 15,
        l: 100,
        isMissile: isMissile
      });
    }
    
    
    function loop() {
      if (!gameActive) return;
      update();
      draw();
      requestAnimationFrame(loop);
    }
    
    /* --- PHYSICS & COLLISION --- */
    function checkRectHit(bx, by,
      tx, ty, w, h, angle) {
      let dx = bx - tx;
      let dy = by - ty;
      let cos = Math.cos(angle);
      let sin = Math.sin(angle);
      let rx = dx * cos + dy *
        sin;
      let ry = -dx * sin + dy *
        cos;
      let pad = 8;
      let limitX = (w / 2) + pad;
      let limitY = (h / 2) + pad;
      return (Math.abs(rx) <=
        limitX && Math.abs(
          ry) <= limitY);
    }
    
    const TURRET_ROT_SPEED =
      0.08;
    
    function update() {
      let spd = 0;
      let turn =
        0;
      let moveAngle = player.angle;
      
      // 1. Keyboard Input
      if (keys['w']) spd = 4;
      if (keys['s']) spd = -3;
      if (keys['a']) turn = -
        0.05;
      if (keys['d']) turn = 0.05;
      
      if (joy.active) {
        spd = 4 * joy.power;
        player.angle = joy.angle;
        moveAngle = joy.angle;
      } else {
        
        player.angle += turn;
        moveAngle = player.angle;
      }
      
      if (aimJoy.active) {
        
        const targetAngle = aimJoy
          .angle;
        let diff = targetAngle - player
          .turretAngle;
        while (diff < -Math.PI) diff +=
          Math.PI * 2;
        while (diff > Math.PI) diff -=
          Math.PI * 2;
        
        if (Math.abs(diff) > 0.01) {
          player.turretAngle += diff *
            TURRET_ROT_SPEED;
        } else {
          player.turretAngle =
            targetAngle;
        }
        
        if (aimJoy.power >= 0.90) {
          fireBullet();
        }
      }
      else {
        let diff = player.angle - player
          .turretAngle;
        while (diff < -Math.PI) diff +=
          Math.PI * 2;
        while (diff > Math.PI) diff -=
          Math.PI * 2;
        if (Math.abs(diff) > 0.01) {
          player.turretAngle += diff *
            TURRET_ROT_SPEED;
        } else {
          player.turretAngle = player
            .angle
        }
      }
      
      
      let nx = player.x + Math.cos(
        moveAngle) * spd;
      let ny = player.y + Math.sin(
        moveAngle) * spd;
      
      if (!checkCol(nx, ny, 25, true)) {
        player.x = nx;
        player.y = ny;
      }
      
      if (!enemy.dead) {
        resolveTankCollision();
      }
      
      
      for (let i = player.bullets
          .length - 1; i >= 0; i--) {
        let b = player.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.l--;
        
        // Check rock collision specifically
        let hitRock = false;
        // Inside update() function, find the bullet loop:
        for (let j = 0; j < obstacles
          .length; j++) {
          let o = obstacles[j];
          if (Math.hypot(b.x - o.x, b
              .y - o.y) < o.r + 5) {
            // Determine damage
            let dmg = b.isMissile ? 40 :
              15;
            
            // Damage the rock locally
            damageRock(o.id, dmg, b.x, b
              .y, true);
            
            b.l = 0; // Kill the bullet
            hitRock = true;
            break;
          }
        }
        
        
        // Check world boundaries if no rock was hit
        if (!hitRock && (b.x < 0 || b
            .x > worldSize.w || b.y <
            0 || b.y > worldSize.h)) {
          b.l = 0;
        }
        
        if (!enemy.dead && b.l > 0) {
          if (b.isMissile) {
            const dx = enemy.x - b.x;
            const dy = enemy.y - b.y;
            const targetAngle = Math
              .atan2(dy, dx);
            const currentAngle = Math
              .atan2(b.vy, b.vx);
            
            let diff = targetAngle -
              currentAngle;
            while (diff < -Math.PI)
              diff += Math.PI * 2;
            while (diff > Math.PI)
              diff -= Math.PI * 2;
            
            const newAngle =
              currentAngle + Math.max(-
                0.15, Math.min(0.15,
                  diff)
              );
            b.vx = Math.cos(newAngle) *
              15;
            b.vy = Math.sin(newAngle) *
              15;
          }
          
          if (checkRectHit(b.x, b.y,
              enemy.x, enemy.y, TANK_W,
              TANK_H, enemy.angle)) {
            b.l = -1;
            SoundFX.hit();
            conn.send({
              type: 'hit',
              dmg: b.isMissile ?
                15 : 4
            });
            particles.push({
              x: b.x,
              y: b.y,
              vx: 0,
              vy: 0,
              l: 10,
              c: '#fff'
            });
          }
        }
        
        if (b.l <= 0) player.bullets
          .splice(i, 1);
      }
      
      
      if (conn) conn.send({
        type: 'update',
        x: player.x,
        y: player.y,
        angle: player.angle,
        turretAngle: player
          .turretAngle,
        hp: player.hp,
        b: player.bullets,
        buffs: {
          s: Date.now() < player
            .shieldUntil,
          u: Date.now() < player
            .unlimitedUntil,
          m: player.hasMissile
        }
      });
      
      
      
      if (player.ammo < MAX_AMMO) {
        if (Date.now() - player
          .lastReload > RELOAD_TIME) {
          player.ammo++;
          player.lastReload = Date
            .now();
        }
      }
      handlePowerups()
    }
    
    function getSafePowerupSpawn() {
      let safe = false;
      let x, y;
      let attempts = 0;
      
      while (!safe && attempts < 50) {
        attempts++;
        x = 50 + Math.random() * (
          worldSize.w - 100);
        y = 50 + Math.random() * (
          worldSize.h - 100);
        
        let isInsideRock = false;
        for (let o of obstacles) {
          if (Math.hypot(x - o.x, y - o
              .y) < o.r + 20) {
            isInsideRock = true;
            break;
          }
        }
        
        if (!isInsideRock) {
          safe = true;
        }
      }
      return safe ? { x, y } : null;
    }
    
    function resolveTankCollision() {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx,
        dy);
      const minDistance = 50;
      
      if (distance < minDistance) {
        
        const overlap = minDistance -
          distance;
        
        
        const nx = distance > 0 ? dx /
          distance : 1;
        const ny = distance > 0 ? dy /
          distance : 0;
        
        
        player.x += nx * overlap;
        player.y += ny * overlap;
        
        
        if (checkCol(player.x, player.y,
            25, true)) {
          player.x -= nx * overlap;
          player.y -= ny * overlap;
        }
      }
    }
    
    
    function checkCol(x, y, r,
      ignoreEnemy = false) {
      if (x < 0 || x > worldSize
        .w || y < 0 || y >
        worldSize.h)
        return true;
      for (let o of obstacles) {
        if (Math.hypot(x - o.x,
            y - o.y) < o.r +
          r) return true;
      }
      if (!ignoreEnemy && !enemy
        .dead && Math.hypot(x -
          enemy.x, y - enemy.y
        ) < 50) return true;
      return false;
    }
    
    function draw(t) {
      canvas.width = window
        .innerWidth;
      canvas.height = window
        .innerHeight;
      
      let cx = Math.max(0, Math
        .min(player.x -
          canvas.width /
          2, worldSize.w -
          canvas.width));
      let cy = Math.max(0, Math
        .min(player.y -
          canvas.height /
          2, worldSize.h -
          canvas.height));
      
      ctx.save();
      ctx.translate(-cx, -cy);
      
      // 1. Draw Ground
      ctx.fillStyle =
        groundPattern;
      ctx.fillRect(0, 0, worldSize
        .w, worldSize.h);
      
      // 2. Draw Obstacles
      obstacles.forEach(o => {
        ctx.fillStyle =
          o.color;
        ctx.beginPath();
        ctx.moveTo(o.x +
          o.pts[0]
          .x, o
          .y + o
          .pts[0]
          .y);
        o.pts.forEach(
          p => ctx
          .lineTo(
            o
            .x +
            p.x,
            o
            .y +
            p.y)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      drawTank(player);
      
      
      if (enemy.x > -500) {
        drawTank(enemy);
      }
      
      // Draw Bullets
      ctx.fillStyle = '#ffd700';
      [...player.bullets, ...enemy
        .bullets
      ].forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b
          .y, 4,
          0, Math
          .PI * 2);
        ctx.fill();
      });
      powerups.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0,
          Math.PI * 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (p.type === 'heal') {
          ctx.fillStyle = '#4caf50';
          ctx.fill();
          ctx.fillStyle = '#d32f2f';
          ctx.font =
            'bold 22px Arial';
          ctx.fillText('+', p.x, p
            .y);
        } else if (p.type ===
          'shield') {
          ctx.fillStyle = '#2196F3';
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font =
            'bold 18px Arial';
          ctx.fillText('P', p.x, p
            .y);
        } else if (p.type ===
          'unlimited') {
          ctx.fillStyle = '#d32f2f';
          ctx.fill();
          ctx.fillStyle = '#FFD700';
          ctx.font =
            'bold 18px Arial';
          ctx.fillText('B', p.x, p
            .y);
        } else if (p.type ===
          'missile') {
          ctx.fillStyle = '#8B0000';
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font =
            'bold 18px Arial';
          ctx.fillText('M', p.x, p
            .y);
        }
      });
      
      const isShielded = (t ===
          player) ? (Date.now() < player
          .shieldUntil) : enemy
        .shieldActive;
      
      if (isShielded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI *
          2);
        ctx.strokeStyle =
          'rgba(33, 150, 243, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5,
          5
        ]); // Makes it look like a spinning energy field
        ctx.stroke();
        ctx.fillStyle =
          'rgba(33, 150, 243, 0.1)';
        ctx.fill();
        ctx.restore();
      }
      
      //Draw Particles
      particles.forEach((p,
        i) => {
        ctx.fillStyle =
          p.c;
        ctx.beginPath();
        ctx.arc(p.x, p
          .y, 3,
          0, Math
          .PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.l--;
        if (p.l <= 0)
          particles
          .splice(i,
            1);
      });
      //Draw Shockwaves
      shockwaves.forEach((s,
        i) => {
        ctx.beginPath();
        ctx.arc(s.x, s
          .y, s.r,
          0, Math
          .PI * 2);
        ctx.lineWidth =
          10 * s
          .alpha;
        ctx.strokeStyle =
          `rgba(255, 200, 50, ${s.alpha})`;
        ctx.stroke();
        s.r += 8;
        s.alpha -= 0.05;
        if (s.alpha <=
          0)
          shockwaves
          .splice(i,
            1);
      });
      
      ctx.restore();
      updateHUD();
    }
    
    function drawTank(t) {
      // 1. Draw the Tank Body & Tracks
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      
      ctx.fillStyle = t.color;
      ctx.fillRect(-25, -20, 50,
        40); // Body
      ctx.fillStyle = '#222';
      ctx.fillRect(-30, -22, 60,
        8); // Left Track
      ctx.fillRect(-30, 14, 60,
        8); // Right Track
      ctx.restore();
      // 2. Draw the Turret & Nozzle
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.turretAngle !==
        undefined ? t.turretAngle : t
        .angle);
      
      // Nozzle color changes if holding a Missile
      const hasM = (t === player) ?
        player.hasMissile : enemy
        .hasMissile;
      ctx.fillStyle = hasM ? '#8B0000' :
        '#222';
      
      ctx.fillRect(0, -4, 40,
        8); // Nozzle barrel
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI *
        2); // Center circle
      ctx.fill();
      ctx.restore();
      const isShielded = (t ===
          player) ? (Date.now() < player
          .shieldUntil) : enemy
        .shieldActive;
      
      if (isShielded) {
        ctx.save();
        ctx.translate(t.x, t.y);
        
        const pulse = Math.sin(Date
          .now() / 150) * 2;
        const shieldRadius = 45 + pulse;
        
        // Outer Glowing Ring
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius, 0,
          Math.PI * 2);
        ctx.strokeStyle =
          'rgba(33, 150, 243, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10,
          5
        ]); // Dashed line effect
        ctx.lineDashOffset = -Date
          .now() /
          50; // Makes the dashes rotate
        ctx.stroke();
        
        
        // Add a slight outer bloom
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#2196F3';
        ctx.stroke();
        
        ctx.restore();
      }
    }
    
    
    function updateHUD() {
      document.getElementById(
          'hp-local').style.width =
        player.hp + '%';
      document.getElementById(
          'hp-remote').style.width =
        enemy.hp + '%';
      
      const container = document
        .getElementById('ammo-count');
      const statusText = document
        .getElementById('ammo-status');
      container.innerHTML = '';
      const isReloading = player.ammo <
        MAX_AMMO;
      statusText.innerText =
        isReloading ? "Reloading..." :
        "Full Ammo";
      if (isReloading) {
        statusText.classList.add(
          'reload')
      } else {
        statusText.classList.remove(
          'reload')
      }
      for (let i = 0; i <
        MAX_AMMO; i++) {
        const b = document
          .createElement('div');
        if (i < player.ammo) {
          b.className = 'bullet active';
        } else if (i === player.ammo &&
          isReloading) {
          b.className =
            'bullet loading';
        } else {
          b.className = 'bullet';
        }
        
        container.appendChild(b);
      }
      
      if (!enemy.dead) drawTracker();
      // Add this to the end of your updateHUD() function:
      const localBuffs = document
        .getElementById('buffs-local');
      const remoteBuffs = document
        .getElementById('buffs-remote');
      localBuffs.innerHTML = '';
      remoteBuffs.innerHTML = '';
      
      const now = Date.now();
      // Player Buffs
      if (now < player.shieldUntil)
        localBuffs.innerHTML +=
        `<span class="buff-icon buff-P">P</span>`;
      if (now < player.unlimitedUntil)
        localBuffs.innerHTML +=
        `<span class="buff-icon buff-B">B</span>`;
      if (player.hasMissile) localBuffs
        .innerHTML +=
        `<span class="buff-icon buff-M">M</span>`;
      
      // Enemy Buffs
      if (enemy.shieldActive)
        remoteBuffs.innerHTML +=
        `<span class="buff-icon buff-P">P</span>`;
      if (enemy.unlimitedActive)
        remoteBuffs.innerHTML +=
        `<span class="buff-icon buff-B">B</span>`;
      if (enemy.hasMissile) remoteBuffs
        .innerHTML +=
        `<span class="buff-icon buff-M">M</span>`;
      
    }
    
    function drawTracker() {
      const dx = enemy.x - player
        .x,
        dy = enemy.y - player.y;
      const angle = Math.atan2(dy,
        dx);
      ctx.save();
      ctx.translate(canvas.width /
        2 + Math.cos(
          angle) * 80,
        canvas
        .height / 2 + Math
        .sin(angle) * 80);
      ctx.rotate(angle);
      ctx.fillStyle =
        'rgba(255,0,0,1)';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-5, 7);
      ctx.lineTo(-5, -7);
      ctx.fill();
      ctx.restore();
    }
    
    function gameOver(win) {
      gameActive = false;
      isGameOver = true;
      document.getElementById(
          'menu-over').style
        .display = 'block';
      const title = document
        .getElementById(
          'over-title');
      title.innerText = win ?
        "MISSION COMPLETE." :
        "MISSION ABORTED.";
      title.style.color = win ?
        "#4caf50" : "#f44336";
    }
    
    function copyCode() {
      const code = document
        .getElementById(
          'code-display')
        .innerText;
      navigator.clipboard
        .writeText(code);
    }
    
    window.onkeydown = e => keys[e
        .key.toLowerCase()] =
      true;
    window.onkeyup = e => keys[e.key
      .toLowerCase()] = false;
    
    // --- MOVEMENT JOYSTICK ---
    const joy = {
      active: false,
      angle: 0,
      power: 0
    };
    const jBase = document
      .getElementById('joy-base'),
      jStick = document.getElementById(
        'joy-stick');
    
    jBase.addEventListener('touchstart',
      (e) => {
        joy.active = true;
        handleJoy(
          e);
      }, { passive: false });
    jBase.addEventListener('touchmove',
      (e) => {
        e.preventDefault();
        handleJoy(
          e);
      }, { passive: false });
    jBase.addEventListener('touchend',
      () => {
        joy.active = false;
        jStick.style.left = '50%';
        jStick.style.top = '50%';
      });
    
    function handleJoy(e) {
      if (!joy.active || e.targetTouches
        .length === 0) return;
      const touch = e.targetTouches[
        0
      ];
      const rect = jBase
        .getBoundingClientRect();
      const dx = touch.clientX - (rect
        .left + 60);
      const dy = touch.clientY - (rect
        .top + 60);
      const dist = Math.min(60, Math
        .hypot(dx, dy));
      joy.angle = Math.atan2(dy, dx);
      joy.power = dist / 60;
      jStick.style.left = 50 + (Math
        .cos(joy.angle) * joy.power *
        50) + '%';
      jStick.style.top = 50 + (Math.sin(
          joy.angle) * joy.power * 50) +
        '%';
    }
    
    // --- AIM/FIRE JOYSTICK ---
    const aimJoy = {
      active: false,
      angle: 0,
      power: 0
    };
    const aBase = document
      .getElementById('aim-base'),
      aStick = document.getElementById(
        'aim-stick');
    
    aBase.addEventListener('touchstart',
      (e) => {
        aimJoy.active = true;
        handleAimJoy(
          e);
      }, { passive: false });
    aBase.addEventListener('touchmove',
      (e) => {
        e.preventDefault();
        handleAimJoy(
          e);
      }, { passive: false });
    aBase.addEventListener('touchend',
      () => {
        aimJoy.active = false;
        aimJoy.power =
          0; // Stop firing immediately
        aStick.style.left = '50%';
        aStick.style.top = '50%';
      });
    
    function handleAimJoy(e) {
      if (!aimJoy.active || e
        .targetTouches.length === 0)
        return;
      const touch = e.targetTouches[0];
      const rect = aBase
        .getBoundingClientRect();
      const dx = touch.clientX - (rect
        .left + 60);
      const dy = touch.clientY - (rect
        .top + 60);
      const dist = Math.min(60, Math
        .hypot(dx, dy));
      
      aimJoy.angle = Math.atan2(dy, dx);
      aimJoy.power = dist /
        60; // Max power is 1.0 at the edge
      
      aStick.style.left = 50 + (Math
        .cos(aimJoy.angle) * aimJoy
        .power * 50) + '%';
      aStick.style.top = 50 + (Math.sin(
          aimJoy.angle) * aimJoy
        .power * 50) + '%';
    }