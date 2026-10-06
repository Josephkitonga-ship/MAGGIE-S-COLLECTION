#!/usr/bin/env python3
"""
MAGGIE'S COLLECTION — build_pages.py

Single source of truth for every HTML page in the shop.
Header, footer, cart drawer and concierge live here once; each page
contributes only its own body. Run it from the project root:

    python3 build_pages.py

It writes index.html, catalogue.html, product.html, delivery.html,
size-guide.html and 404.html. The staff desks live in their own
repository (MAGGIES-ADMIN) and are not part of this site.

Edit this file, never the generated HTML — a rebuild overwrites them.
"""

import os
import time

ROOT = os.path.dirname(os.path.abspath(__file__))

NAV_ITEMS = [
    ("index.html", "Home"),
    ("catalogue.html", "Catalogue"),
    ("delivery.html", "Delivery &amp; Holds"),
    ("size-guide.html", "Size Guide"),
]

# changes every build, so phones fetch fresh scripts instead of an old cached copy
VERSION = time.strftime("%Y%m%d%H%M")

SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"

# --------------------------------------------------------------------
# social buttons (links are filled in by js/script.js from SHOP.social)
# --------------------------------------------------------------------

ICON_WA = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.2A9.5 9.5 0 1 0 12 2.5z" '
           'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
           '<path d="M8.6 7.9c-.3.3-.6.9-.5 1.6.3 2.1 2.9 4.9 5.2 5.4.7.2 1.4-.2 1.7-.6l.3-.6-1.7-1-.9.7c-.9-.3-2-1.3-2.4-2.2l.7-.9-1-1.7z" '
           'fill="currentColor"/></svg>')
ICON_FB = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 21v-8h2.7l.4-3.2h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.5'
           'c-.3 0-1.2-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H7.7V13h2.7v8z" fill="currentColor"/></svg>')
ICON_IG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" '
           'stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" '
           'stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>')


def social(with_labels):
    def one(key, label, icon):
        text = "<span>%s</span>" % label if with_labels else ""
        return ('<a class="social__btn" data-social="%s" href="#" aria-label="%s">%s%s</a>'
                % (key, label, icon, text))
    return "".join([
        one("whatsapp", "WhatsApp", ICON_WA),
        one("facebook", "Facebook", ICON_FB),
        one("instagram", "Instagram", ICON_IG),
    ])


THEME_BOOT = ('<script>(function(){try{var t=localStorage.getItem("maggies_theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)")'
              '.matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>')

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESC}}">
<meta name="theme-color" content="#FDF8F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E1216" media="(prefers-color-scheme: dark)">
{{THEME_BOOT}}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Karla:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{PREFIX}}css/styles.css?v={{VERSION}}">
<link rel="stylesheet" href="{{PREFIX}}css/stores.css?v={{VERSION}}">
{{EXTRA_HEAD}}
</head>
<body>
<a class="skip" href="#main">Skip to the main content</a>

<header class="site-head">
  <div class="wrap site-head__bar">
    <button class="icon-btn menu-trigger" id="burger" type="button" aria-label="Toggle Navigation" aria-expanded="false" aria-controls="navDrawer">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
    <a class="brand" href="{{PREFIX}}index.html">
      <span class="brand__name">Maggie's Collection</span>
      <span class="brand__note">Kimana Town</span>
    </a>
    <nav class="nav-inline" aria-label="Main">
{{NAV}}
    </nav>
    <div class="head-tools">
      <div class="social social--head">{{SOCIAL_HEAD}}</div>
      <button class="icon-btn cart-btn js-cart-open" type="button" aria-label="Open your saved items">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>
        <span class="cart-count" hidden>0</span>
      </button>
    </div>
  </div>
</header>

<div class="nav-scrim" id="navScrim"></div>
<aside class="nav-drawer" id="navDrawer" aria-label="Navigation">
  <div class="nav-drawer__head">
    <span class="brand__name">Maggie's Collection</span>
    <button class="icon-btn menu-trigger" id="navClose" type="button" aria-label="Close navigation">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </div>
  <nav class="nav-drawer__links" id="nav" aria-label="Main">
{{NAV}}
  </nav>
  <div class="nav-drawer__foot">
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false">🌙 Dark</button>
  </div>
</aside>

<main id="main">
{{BODY}}
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h4>Maggie's Collection</h4>
        <p style="color:inherit">Your family fashion destination in Kimana. Outfits for men, women, and kids—picked piece by piece and delivered across Kimana, Oloitokitok, and beyond.</p>
        <a class="btn btn--rose" id="waDirect" href="{{PREFIX}}delivery.html" target="_blank" rel="noopener">Message us on WhatsApp</a>
        <div class="social">{{SOCIAL_FOOT}}</div>
      </div>
      <div>
        <h4>Shop</h4>
        <ul class="foot-list">
          <li><a href="{{PREFIX}}catalogue.html?d=women">Women</a></li>
          <li><a href="{{PREFIX}}catalogue.html?d=men">Men</a></li>
          <li><a href="{{PREFIX}}catalogue.html?d=kids">Kids &amp; teens</a></li>
          <li><a href="{{PREFIX}}catalogue.html?d=unisex">Unisex</a></li>
          <li><a href="{{PREFIX}}catalogue.html?d=shoes">Shoes</a></li>
          <li><a href="{{PREFIX}}catalogue.html?d=home">Home &amp; Living</a></li>
          <li><a href="{{PREFIX}}catalogue.html?new=1">New arrivals</a></li>
          <li><a href="{{PREFIX}}catalogue.html?offers=1">On offer</a></li>
        </ul>
      </div>
      <div>
        <h4>Customer Info</h4>
        <ul class="foot-list">
          <li><a href="{{PREFIX}}delivery.html">Delivery &amp; Holds</a></li>
          <li><a href="{{PREFIX}}size-guide.html">Size Guide</a></li>
          <li><a href="{{PREFIX}}delivery.html#returns">Exchanges &amp; Policy</a></li>
        </ul>
      </div>
    </div>
    <hr class="foot-rule">
    <div class="foot-fine">
      <span>&copy; <span class="js-year">2026</span> Maggie's Collection, Kimana Town, Kajiado County.</span>
      <span>Built by Flynn Technologies</span>
    </div>
  </div>
</footer>

<div class="scrim" id="scrim"></div>

<aside class="drawer" id="cartDrawer" aria-label="Your saved items">
  <div class="drawer__head">
    <h3>Your Selected Pieces</h3>
    <button class="icon-btn" id="cartClose" type="button">Close</button>
  </div>
  <div class="drawer__body">
    <p class="form-msg" id="cartNote"></p>
    <div id="cartLines"></div>
    <p class="form-msg" id="cartSplit" style="margin-top:0.8rem"></p>

    <form id="checkoutForm" novalidate style="margin-top:1.4rem">
      <h3 style="font-size:1.1rem">Where should we deliver or hold it?</h3>
      <label class="field"><span>Your name</span><input id="custName" name="name" type="text" autocomplete="name" required></label>
      <label class="field"><span>Phone number</span><input id="custPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required></label>
      <label class="field"><span>Delivery area</span><select id="zone" name="zone"></select></label>
      <label class="field"><span>Exact place to drop it</span><input id="custLocation" name="location" type="text" placeholder="Shop, stage or house you are known at" required></label>
      <label class="field"><span>Anything we should know</span><textarea id="custNotes" name="notes" rows="2"></textarea></label>
      <p class="form-msg" id="feeNote"></p>
      <p class="form-msg" id="checkoutMsg"></p>
    </form>
  </div>
  <div class="drawer__foot">
    <div class="totals"><span>Estimated Total:</span><b id="grandTotal">KSh 0</b></div>
    <button class="btn btn--solid btn--wide" id="toCheckout" type="submit" form="checkoutForm" disabled>Send Selection via WhatsApp</button>
  </div>
</aside>

<button class="concierge-btn" id="chatOpen" type="button">Ask the concierge</button>

<section class="concierge" id="concierge" aria-label="Concierge">
  <div class="concierge__head">
    <strong>Concierge</strong>
    <button id="chatClose" type="button" aria-label="Close the concierge">&times;</button>
  </div>
  <div class="concierge__log" id="chatLog"></div>
  <div class="quick" id="chatQuick"></div>
  <form class="concierge__form" id="chatForm">
    <input id="chatInput" type="text" placeholder="Ask about delivery, sizing, payment…" autocomplete="off">
    <button class="btn btn--rose" type="submit">Ask</button>
  </form>
</section>

<script src="{{SUPABASE_CDN}}"></script>
<script src="{{PREFIX}}js/theme.js?v={{VERSION}}"></script>
<script src="{{PREFIX}}js/config.js?v={{VERSION}}"></script>
<script src="{{PREFIX}}js/orders.js?v={{VERSION}}"></script>
<script src="{{PREFIX}}js/faq.js?v={{VERSION}}"></script>
<script src="{{PREFIX}}js/script.js?v={{VERSION}}"></script>
</body>
</html>
"""

# --------------------------------------------------------------------
# page bodies
# --------------------------------------------------------------------

INDEX_BODY = """
<section class="hero">
  <div class="wrap hero__grid">
    <div>
      <h1 class="hero__title">Quality Fashion for the Whole Family in Kimana</h1>
      <p class="hero__lead">Handpicked outfits for men, women, and kids—from daily wear to special occasions. Message us on WhatsApp to hold your size or arrange local delivery.</p>
      <div class="hero__actions">
        <a class="btn btn--solid" href="catalogue.html">Browse the Rails</a>
        <a class="btn btn--ghost" href="size-guide.html">Find Your Size</a>
      </div>
    </div>
    <div class="arch">
      <img src="images/hero.jpg" alt="Inside Maggie's Collection" loading="eager" onerror="this.remove()">
      <span class="arch__seal">Kimana Town &middot; since 2020</span>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <h2>One Message Covers the Family</h2>
    <p>Find women&rsquo;s collections, menswear, and kids&rsquo; outfits side by side. Select everything your family needs and send us one quick WhatsApp message to hold your pieces or deliver to town.</p>
    <div class="boutiques boutiques--three">
      <a class="boutique boutique--maggies" href="catalogue.html?d=women">
        <img class="boutique__photo" src="images/women.jpg" alt="" loading="lazy" onerror="this.remove()">
        <h3>Women</h3>
        <p>Dresses, tops, African wear and more.</p>
        <span class="boutique__go">Shop women&rsquo;s</span>
      </a>
      <a class="boutique boutique--davids" href="catalogue.html?d=men">
        <img class="boutique__photo" src="images/men.jpg" alt="" loading="lazy" onerror="this.remove()">
        <h3>Men</h3>
        <p>Shirts, trousers, jackets and suits.</p>
        <span class="boutique__go">Shop menswear</span>
      </a>
      <a class="boutique boutique--kids" href="catalogue.html?d=kids">
        <img class="boutique__photo" src="images/kids.jpg" alt="" loading="lazy" onerror="this.remove()">
        <h3>Kids &amp; teens</h3>
        <p>Everyday and occasion outfits.</p>
        <span class="boutique__go">Shop kids&rsquo;</span>
      </a>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <div class="rail-head">
      <h2>New on the rail</h2>
      <a href="catalogue.html">Everything</a>
    </div>
    <div class="rail" id="newRail"></div>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap split">
    <div class="reveal">
      <h2>Personalized Care for Every Order</h2>
      <p>From children&rsquo;s sizes to adult 5XL, we make sure every piece fits.</p>
      <p>Free hem alterations before pickup, 24-hour holds with zero deposit, and fast WhatsApp response times. Message us and the Fashion Team answers, usually within minutes, not days.</p>
    </div>
    <ul class="note-list reveal">
      <li><b>Alterations are free</b><br>Hems and waists on anything you take home, usually done the same day.</li>
      <li><b>We hold pieces</b><br>24 hours with nothing down, five days with half paid.</li>
      <li><b>Delivery reaches you</b><br>Free in town, boda to Oloitokitok, courier to Nairobi.</li>
      <li><b>Exchanges are simple</b><br><span id="returnDays">3</span> days with tags on, no argument.</li>
      <li><b>Every size, every age</b><br>Kids from 2 years up to adult 5XL, nothing shut off by gender.</li>
    </ul>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Browse by rail</h2>
    <div class="grid" style="margin-top:1.2rem">
      <a class="card" href="catalogue.html?d=women"><div class="card__body"><h3 class="card__name">Women</h3><p class="card__desc">Dresses, tops, skirts, African wear.</p></div></a>
      <a class="card" href="catalogue.html?d=men"><div class="card__body"><h3 class="card__name">Men</h3><p class="card__desc">Shirts, trousers, jackets, suits.</p></div></a>
      <a class="card" href="catalogue.html?d=kids"><div class="card__body"><h3 class="card__name">Kids &amp; teens</h3><p class="card__desc">Everyday and occasion outfits.</p></div></a>
      <a class="card" href="catalogue.html?d=unisex"><div class="card__body"><h3 class="card__name">Unisex</h3><p class="card__desc">Pieces anyone can wear.</p></div></a>
      <a class="card" href="catalogue.html?d=shoes"><div class="card__body"><h3 class="card__name">Shoes</h3><p class="card__desc">Sandals, heels, flats, sneakers.</p></div></a>
      <a class="card" href="catalogue.html?d=bags"><div class="card__body"><h3 class="card__name">Bags</h3><p class="card__desc">Handbags, backpacks, travel.</p></div></a>
      <a class="card" href="catalogue.html?d=accessories"><div class="card__body"><h3 class="card__name">Accessories</h3><p class="card__desc">Jewellery, belts, scarves, caps.</p></div></a>
      <a class="card" href="catalogue.html?d=home"><div class="card__body"><h3 class="card__name">Home &amp; Living</h3><p class="card__desc">Bedding, curtains, kitchen, towels.</p></div></a>
    </div>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap split">
    <div>
      <h2>Come and try things on.</h2>
      <p id="shopAddress">Kimana Town, Kajiado South. Alongside Zawadi Hotel.</p>
      <p>There is a mirror, a fitting room and tea. Walk-ins do not need an appointment.</p>
    </div>
    <ul class="note-list" id="hoursList"></ul>
  </div>
</section>
"""

CATALOGUE_BODY = """
<section class="section--tight catalogue-page">
  <div class="filters">
    <div class="wrap">
      <div class="switch" id="storeSwitch" aria-label="Departments"></div>
      <div class="chips" id="chips" aria-label="Types"></div>
    </div>
  </div>
  <div class="wrap">
    <h1 class="page-title">The rail today</h1>
    <p class="page-lead">Everything below is in the shop right now. Tap a piece to see it in full, pick a size, save it to your list, and send us one WhatsApp message to hold it.</p>
  </div>
  <div class="wrap" id="catalogue">
    <div class="state">Loading the rail…</div>
  </div>
</section>
"""

PRODUCT_BODY = """
<section class="section--tight">
  <div class="wrap" id="productView">
    <div class="state">Loading this piece…</div>
  </div>
</section>
"""

DELIVERY_BODY = """
<section class="section--tight">
  <div class="wrap">
    <h1 style="margin-top:1.5rem">Delivery &amp; Holds</h1>
    <p>No surprises at the door. Here is exactly what it costs to get a parcel to you, how holds work, how to pay, and what happens if something does not fit. Everything in one WhatsApp message travels together and delivery is charged once.</p>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <h2>Where we deliver</h2>
    <div class="table-scroll" id="zoneTable"></div>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <h2>Holding a piece</h2>
    <p>Send us your saved items on WhatsApp and we check each piece and size for you. We hold them 24 hours with no deposit, or up to five days with half paid. Pick up in the shop or ask for delivery.</p>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap split">
    <div>
      <h2>Paying</h2>
      <p>M-Pesa is the main option. Confirm the number with us on WhatsApp before you send anything, then share the confirmation message so we can match it to your reservation.</p>
      <p id="mpesaLine"></p>
      <p>Cash works for hand deliveries inside town. Parcels leaving Kimana are paid for before they travel.</p>
    </div>
    <div>
      <h2 id="returns">Exchanges &amp; Policy</h2>
      <p>You have <span id="returnDays">3</span> days to exchange anything that does not fit, as long as the tags are still on and it has not been worn or washed.</p>
      <p>Faulty pieces are replaced or refunded in full, and we cover the delivery both ways. Pierced jewellery cannot come back, for hygiene.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div>
      <h2>Finding us</h2>
      <p id="shopAddress">Kimana Town, Kajiado South. Alongside Zawadi Hotel.</p>
      <p>Ask anyone for Zawadi Hotel and we are right beside it.</p>
    </div>
    <ul class="note-list" id="hoursList"></ul>
  </div>
</section>
"""

SIZE_BODY = """
<section class="section--tight">
  <div class="wrap">
    <h1 style="margin-top:1.5rem">Size guide</h1>
    <p>Kids from 2 years up to adult 5XL, nothing shut off by gender. Measure over light clothing, keep the tape flat, and breathe normally. If you are between two sizes, take the larger one and we will take it in for free.</p>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <h2>Dresses, tops and skirts</h2>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Size</th><th>Bust (cm)</th><th>Waist (cm)</th><th>Hips (cm)</th></tr></thead>
        <tbody>
          <tr><td>XS</td><td>80 &ndash; 84</td><td>62 &ndash; 66</td><td>86 &ndash; 90</td></tr>
          <tr><td>S</td><td>85 &ndash; 89</td><td>67 &ndash; 71</td><td>91 &ndash; 95</td></tr>
          <tr><td>M</td><td>90 &ndash; 94</td><td>72 &ndash; 76</td><td>96 &ndash; 100</td></tr>
          <tr><td>L</td><td>95 &ndash; 100</td><td>77 &ndash; 83</td><td>101 &ndash; 106</td></tr>
          <tr><td>XL</td><td>101 &ndash; 107</td><td>84 &ndash; 90</td><td>107 &ndash; 113</td></tr>
          <tr><td>XXL</td><td>108 &ndash; 115</td><td>91 &ndash; 98</td><td>114 &ndash; 121</td></tr>
          <tr><td>3XL</td><td>116 &ndash; 123</td><td>99 &ndash; 106</td><td>122 &ndash; 129</td></tr>
          <tr><td>4XL</td><td>124 &ndash; 131</td><td>107 &ndash; 114</td><td>130 &ndash; 137</td></tr>
          <tr><td>5XL</td><td>132 &ndash; 140</td><td>115 &ndash; 123</td><td>138 &ndash; 146</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap">
    <h2>Shirts and jackets by chest</h2>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Size</th><th>Chest (cm)</th><th>Collar (cm)</th><th>Sleeve (cm)</th></tr></thead>
        <tbody>
          <tr><td>S</td><td>88 &ndash; 94</td><td>37 &ndash; 38</td><td>62</td></tr>
          <tr><td>M</td><td>95 &ndash; 101</td><td>39 &ndash; 40</td><td>64</td></tr>
          <tr><td>L</td><td>102 &ndash; 108</td><td>41 &ndash; 42</td><td>65</td></tr>
          <tr><td>XL</td><td>109 &ndash; 116</td><td>43 &ndash; 44</td><td>66</td></tr>
          <tr><td>XXL</td><td>117 &ndash; 124</td><td>45 &ndash; 46</td><td>67</td></tr>
          <tr><td>3XL</td><td>125 &ndash; 132</td><td>47 &ndash; 48</td><td>68</td></tr>
          <tr><td>4XL</td><td>133 &ndash; 140</td><td>49 &ndash; 50</td><td>69</td></tr>
          <tr><td>5XL</td><td>141 &ndash; 148</td><td>51 &ndash; 52</td><td>70</td></tr>
        </tbody>
      </table>
    </div>
    <p style="margin-top:1rem">Measure the chest under the arms at the fullest point, with the tape level across the back.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Trousers by waist</h2>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Size</th><th>Waist (cm)</th><th>Waist (inches)</th><th>Inside leg (cm)</th></tr></thead>
        <tbody>
          <tr><td>S</td><td>67 &ndash; 71</td><td>27 &ndash; 28</td><td>76</td></tr>
          <tr><td>M</td><td>72 &ndash; 79</td><td>29 &ndash; 31</td><td>78</td></tr>
          <tr><td>L</td><td>80 &ndash; 87</td><td>32 &ndash; 34</td><td>79</td></tr>
          <tr><td>XL</td><td>88 &ndash; 95</td><td>35 &ndash; 37</td><td>81</td></tr>
          <tr><td>XXL</td><td>96 &ndash; 104</td><td>38 &ndash; 41</td><td>81</td></tr>
          <tr><td>3XL</td><td>105 &ndash; 113</td><td>42 &ndash; 44</td><td>82</td></tr>
          <tr><td>4XL</td><td>114 &ndash; 122</td><td>45 &ndash; 48</td><td>82</td></tr>
          <tr><td>5XL</td><td>123 &ndash; 131</td><td>49 &ndash; 51</td><td>83</td></tr>
        </tbody>
      </table>
    </div>
    <p style="margin-top:1rem">Hemming is free on anything you take home from us. Tell us the shoes you will wear them with and the tailor sets the length to match.</p>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap">
    <h2>Men's trousers &mdash; numbered waist</h2>
    <p>Men's trousers are sold by waist number, not letters. Find your usual number below.</p>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Waist size</th><th>Waist (cm)</th><th>Inside leg (cm)</th></tr></thead>
        <tbody>
          <tr><td>28</td><td>71</td><td>78</td></tr>
          <tr><td>30</td><td>76</td><td>79</td></tr>
          <tr><td>32</td><td>81</td><td>80</td></tr>
          <tr><td>34</td><td>86</td><td>81</td></tr>
          <tr><td>36</td><td>91</td><td>81</td></tr>
          <tr><td>38</td><td>97</td><td>82</td></tr>
          <tr><td>40</td><td>102</td><td>82</td></tr>
          <tr><td>42</td><td>107</td><td>83</td></tr>
          <tr><td>44</td><td>112</td><td>83</td></tr>
          <tr><td>46</td><td>117</td><td>84</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Kids and teens</h2>
    <p>Kids&rsquo; pieces are sold by age. Heights are a guide: if your child is between two sizes, take the larger one and we will hem it for free.</p>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Age</th><th>Height (cm)</th><th>Chest (cm)</th><th>Waist (cm)</th></tr></thead>
        <tbody>
          <tr><td>2 &ndash; 3 years</td><td>92 &ndash; 98</td><td>53 &ndash; 55</td><td>51 &ndash; 53</td></tr>
          <tr><td>4 &ndash; 5 years</td><td>104 &ndash; 110</td><td>57 &ndash; 59</td><td>53 &ndash; 55</td></tr>
          <tr><td>6 &ndash; 7 years</td><td>116 &ndash; 122</td><td>61 &ndash; 64</td><td>55 &ndash; 57</td></tr>
          <tr><td>8 &ndash; 9 years</td><td>128 &ndash; 134</td><td>66 &ndash; 69</td><td>58 &ndash; 60</td></tr>
          <tr><td>10 &ndash; 11 years</td><td>140 &ndash; 146</td><td>72 &ndash; 76</td><td>61 &ndash; 63</td></tr>
          <tr><td>12 &ndash; 13 years</td><td>152 &ndash; 158</td><td>78 &ndash; 82</td><td>64 &ndash; 67</td></tr>
          <tr><td>14 &ndash; 15 years</td><td>164 &ndash; 170</td><td>84 &ndash; 88</td><td>68 &ndash; 71</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Bags</h2>
    <p>Bags run by named size rather than a chart. Suitcase covers our travel cases separately from everyday bags.</p>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>Size</th><th>Roughly fits</th><th>Dimensions (cm)</th></tr></thead>
        <tbody>
          <tr><td>Small</td><td>Phone, cards, small essentials</td><td>20 &times; 15 &times; 8</td></tr>
          <tr><td>Medium</td><td>Everyday carry, a light laptop</td><td>32 &times; 26 &times; 12</td></tr>
          <tr><td>Large</td><td>Full workday or a weekend</td><td>40 &times; 32 &times; 16</td></tr>
          <tr><td>Suitcase</td><td>Travel, cabin-friendly</td><td>55 &times; 40 &times; 22</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap">
    <h2>Shoes</h2>
    <div class="table-scroll">
      <table class="table">
        <thead><tr><th>EU</th><th>UK</th><th>US</th><th>Foot length (cm)</th></tr></thead>
        <tbody>
          <tr><td>36</td><td>3</td><td>4</td><td>22.5</td></tr>
          <tr><td>37</td><td>4</td><td>5</td><td>23.5</td></tr>
          <tr><td>38</td><td>5</td><td>6</td><td>24.0</td></tr>
          <tr><td>39</td><td>6</td><td>7</td><td>25.0</td></tr>
          <tr><td>40</td><td>6.5</td><td>7.5</td><td>25.5</td></tr>
          <tr><td>41</td><td>7</td><td>8</td><td>26.5</td></tr>
          <tr><td>42</td><td>8</td><td>9</td><td>27.0</td></tr>
          <tr><td>43</td><td>9</td><td>10</td><td>27.5</td></tr>
          <tr><td>44</td><td>9.5</td><td>10.5</td><td>28.5</td></tr>
          <tr><td>45</td><td>10.5</td><td>11.5</td><td>29.0</td></tr>
        </tbody>
      </table>
    </div>
    <p style="margin-top:1rem">Stand on paper against a wall, mark the longest toe, and measure from the wall. Take the larger size if you land between two. UK and US numbers here are the men's run; women's US sizing is usually about one and a half numbers higher.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Still not sure?</h2>
    <p>Send your usual size and the piece you are looking at to the concierge below, or message the shop directly. We would rather answer first than exchange later, and the tailor can adjust most things either way.</p>
    <a class="btn btn--solid" href="catalogue.html">Back to the rail</a>
  </div>
</section>
"""

LOST_BODY = """
<section class="section lost">
  <div class="wrap">
    <h1>That page is not on the rail.</h1>
    <p>The link may be old, or the piece sold and came off the site. The catalogue below has everything we have today.</p>
    <div class="hero__actions" style="justify-content:center">
      <a class="btn btn--solid" href="catalogue.html">Go to the catalogue</a>
      <a class="btn btn--ghost" href="index.html">Back to the front</a>
    </div>
  </div>
</section>
"""

PAGES = [
    {
        "file": "index.html",
        "title": "Maggie's Collection — quality fashion for the whole family in Kimana",
        "desc": "Handpicked outfits for men, women and kids in Kimana Town, beside Zawadi Hotel. Free hem alterations, 24-hour holds, local delivery. Message us on WhatsApp to hold your size.",
        "body": INDEX_BODY,
    },
    {
        "file": "catalogue.html",
        "title": "Catalogue — Maggie's Collection",
        "desc": "Everything on the rail today for men, women and kids, sorted by category, with sizes, prices and offers.",
        "body": CATALOGUE_BODY,
    },
    {
        "file": "product.html",
        "title": "Piece — Maggie's Collection",
        "desc": "See this piece in full: photos, price, sizes and fabric. Chat to reserve it on WhatsApp.",
        "body": PRODUCT_BODY,
    },
    {
        "file": "delivery.html",
        "title": "Delivery &amp; Holds — Maggie's Collection",
        "desc": "Delivery fees across Kimana, Oloitokitok, Emali and Nairobi, how 24-hour holds work, M-Pesa payment, and exchanges.",
        "body": DELIVERY_BODY,
    },
    {
        "file": "size-guide.html",
        "title": "Size guide — Maggie's Collection",
        "desc": "Kids' sizes by age, plus chest, bust, waist, hip and shoe measurements in centimetres, XS to 5XL, so your piece fits the first time.",
        "body": SIZE_BODY,
    },
    {
        "file": "404.html",
        "title": "Page not found — Maggie's Collection",
        "desc": "That page is not here. Head back to the catalogue.",
        "body": LOST_BODY,
    },
]


def build_nav(current, prefix):
    lines = []
    for href, label in NAV_ITEMS:
        mark = ' aria-current="page"' if href == current else ""
        lines.append('      <a href="%s%s"%s>%s</a>' % (prefix, href, mark, label))
    return "\n".join(lines)


def render(page):
    prefix = ""
    html = SHELL
    html = html.replace("{{TITLE}}", page["title"])
    html = html.replace("{{DESC}}", page["desc"])
    html = html.replace("{{THEME_BOOT}}", THEME_BOOT)
    html = html.replace("{{EXTRA_HEAD}}", page.get("head", ""))
    html = html.replace("{{NAV}}", build_nav(page["file"], prefix))
    html = html.replace("{{SOCIAL_HEAD}}", social(False))
    html = html.replace("{{SOCIAL_FOOT}}", social(True))
    html = html.replace("{{BODY}}", page["body"].strip())
    html = html.replace("{{PREFIX}}", prefix)
    html = html.replace("{{SUPABASE_CDN}}", SUPABASE_CDN)
    html = html.replace("{{VERSION}}", VERSION)
    return html


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ROOT, exist_ok=True)
    with open(full, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("wrote %-22s %6d bytes" % (path, len(text)))


def main():
    for page in PAGES:
        write(page["file"], render(page))
    print("done — %d pages" % len(PAGES))


if __name__ == "__main__":
    main()
