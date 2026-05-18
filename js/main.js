/**
 * 知汇门 — 前端交互脚本
 * 功能：主题切换 / 搜索 / 回到顶部 / 移动端菜单
 *      文章目录 / 阅读进度条 / 阅读时间 / 标签云 / 分享
 */
(function () {
  'use strict';

  // ============================================================
  // 1. 暗色/亮色主题切换
  // ============================================================
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') html.setAttribute('data-theme', 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ============================================================
  // 2. 移动端菜单
  // ============================================================
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', function (e) {
      if (!mobileBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ============================================================
  // 3. 回到顶部
  // ============================================================
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', function () {
      backToTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // 4. 搜索
  // ============================================================
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (searchInput && searchResults) {
    const articles = window.__ARTICLE_INDEX__ || [];
    searchInput.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();
      if (query.length < 1) { searchResults.classList.remove('active'); searchResults.innerHTML = ''; return; }
      const matches = articles.filter(function (a) {
        return a.title.toLowerCase().indexOf(query) !== -1 ||
               a.excerpt.toLowerCase().indexOf(query) !== -1 ||
               (a.tags || []).some(t => t.toLowerCase().indexOf(query) !== -1);
      });
      searchResults.innerHTML = matches.length === 0
        ? '<div class="no-result">没有找到相关文章</div>'
        : matches.slice(0, 8).map(a => '<a href="' + a.url + '"><strong>' + escapeHTML(a.title) + '</strong> <span style="color:var(--text-muted);font-size:0.8rem">' + escapeHTML(a.channel || '') + '</span></a>').join('');
      searchResults.classList.add('active');
    });
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) searchResults.classList.remove('active');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { searchResults.classList.remove('active'); searchInput.blur(); }
    });
  }

  // ============================================================
  // 5. 阅读进度条
  // ============================================================
  (function () {
    const bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.id = 'reading-progress';
    document.body.prepend(bar);
    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(progress, 100) + '%';
    });
  })();

  // ============================================================
  // 6. 文章目录（TOC）自动生成
  // ============================================================
  (function () {
    const articleBody = document.querySelector('.article-body');
    if (!articleBody) return;

    const headings = articleBody.querySelectorAll('h2, h3');
    if (headings.length < 2) return;

    // 给每个标题加 id
    headings.forEach(function (h, i) {
      if (!h.id) h.id = 'heading-' + i;
    });

    // 创建 TOC 容器
    const toc = document.createElement('nav');
    toc.className = 'article-toc';
    toc.id = 'article-toc';
    toc.innerHTML = '<div class="article-toc-title">📑 文章目录</div>';

    const ul = document.createElement('ul');
    headings.forEach(function (h) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      if (h.tagName === 'H3') a.className = 'toc-h3';
      li.appendChild(a);
      ul.appendChild(li);
    });
    toc.appendChild(ul);

    // 插入到文章区域前面
    const articleDetail = document.querySelector('.article-detail');
    const wrapper = document.createElement('div');
    wrapper.className = 'article-wrapper';
    const articleHeader = document.querySelector('.article-header');
    const existingContent = document.querySelector('.article-detail');

    // 创建左侧内容区
    const contentCol = document.createElement('div');
    contentCol.style.flex = '1';
    contentCol.style.minWidth = '0';

    // 移动所有现有内容到 wrapper 中
    while (existingContent.firstChild) {
      contentCol.appendChild(existingContent.firstChild);
    }
    wrapper.appendChild(contentCol);
    wrapper.appendChild(toc);
    existingContent.appendChild(wrapper);

    // 滚动高亮当前标题
    const tocLinks = toc.querySelectorAll('a');
    window.addEventListener('scroll', function () {
      let current = '';
      headings.forEach(function (h) {
        if (h.getBoundingClientRect().top <= 120) current = h.id;
      });
      tocLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    });
  })();

  // ============================================================
  // 7. 阅读时间估算
  // ============================================================
  (function () {
    const articleBody = document.querySelector('.article-body');
    const metaArea = document.querySelector('.article-meta');
    if (!articleBody || !metaArea) return;

    const text = articleBody.textContent;
    const charCount = text.replace(/\s/g, '').length;
    // 中文阅读速度约 400 字/分钟
    const minutes = Math.max(1, Math.round(charCount / 400));

    const stats = document.createElement('span');
    stats.className = 'article-stats-inline';
    stats.innerHTML = '📖 约 ' + minutes + ' 分钟 · ' + charCount + ' 字';
    stats.style.cssText = 'font-size:0.8rem;color:var(--text-muted);margin-left:8px;';

    // 插入到 meta 区域的第一个子元素中
    const firstSpan = metaArea.querySelector('span');
    if (firstSpan) {
      firstSpan.appendChild(document.createTextNode(' · '));
      firstSpan.appendChild(stats);
    }
  })();

  // ============================================================
  // 8. 标签云生成
  // ============================================================
  (function () {
    const tagClouds = document.querySelectorAll('.tag-cloud[data-auto]');
    if (tagClouds.length === 0) return;

    const articles = window.__ARTICLE_INDEX__ || [];
    if (articles.length === 0) return;

    // 统计标签频率
    const tagCount = {};
    articles.forEach(function (a) {
      (a.tags || []).forEach(function (t) {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });

    const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

    tagClouds.forEach(function (cloud) {
      const maxCount = tags.length > 0 ? tags[0][1] : 1;
      const displayTags = tags.slice(0, cloud.dataset.limit || 30);

      displayTags.forEach(function ([tag, count]) {
        const a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.textContent = tag + ' (' + count + ')';
        // 按频率分 4 个尺寸
        const ratio = count / maxCount;
        const size = ratio > 0.7 ? 4 : ratio > 0.4 ? 3 : ratio > 0.2 ? 2 : 1;
        a.className = 'tag-size-' + size;
        a.setAttribute('data-tag', tag);
        // 点击标签触发搜索
        a.addEventListener('click', function () {
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.value = tag;
            searchInput.dispatchEvent(new Event('input'));
            searchInput.scrollIntoView({ behavior: 'smooth' });
          }
        });
        cloud.appendChild(a);
      });
    });
  })();

  // ============================================================
  // 9. 社交分享按钮
  // ============================================================
  (function () {
    const shareContainer = document.querySelector('.share-buttons');
    if (!shareContainer) return;

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    // 复制链接
    const copyBtn = shareContainer.querySelector('.share-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(window.location.href).then(function () {
          const orig = copyBtn.textContent;
          copyBtn.textContent = '✓';
          setTimeout(function () { copyBtn.textContent = orig; }, 1500);
        });
      });
    }
  })();

  // ============================================================
  // 10. 图片懒加载
  // ============================================================
  (function () {
    if (!('IntersectionObserver' in window)) return;
    const lazyImages = document.querySelectorAll('img[data-src]');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    lazyImages.forEach(function (img) { observer.observe(img); });
  })();

  // ============================================================
  // 辅助函数
  // ============================================================
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

})();
