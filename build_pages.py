#!/usr/bin/env python3
"""
MAGGIE'S COLLECTION — build_pages.py

Single source of truth for every HTML page in the shop.
Header, footer, cart drawer and concierge live here once; each page
contributes only its own body. Run it from the project root:

    python3 build_pages.py

It writes index.html, catalogue.html, delivery.html, size-guide.html,
404.html and admin/admin.html. Edit this file, never the generated
HTML — a rebuild overwrites them.
"""

import os

ROOT = os.path.dirname(os.path.abspath(__file__))

NAV_ITEMS = [
    ("index.html", "Home"),
    ("catalogue.html", "Catalogue"),
    ("delivery.html", "Delivery"),
    ("size-guide.html", "Size guide"),
]

SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESC}}">
<meta name="theme-color" content="#FDF8F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E1216" media="(prefers-color-scheme: dark)">
<script>(function(){try{var t=localStorage.getItem("maggies_theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Karla:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{PREFIX}}css/styles.css">
{{EXTRA_HEAD}}
</head>
<body>
<a class="skip" href="#main">Skip to the main content</a>

<header class="site-head">
  <div class="wrap site-head__bar">
    <a class="brand" href="{{PREFIX}}index.html">
      <span class="brand__name">Maggie's Collection</span>
      <span class="brand__note">Kimana Town</span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">
{{NAV}}
    </nav>
    <div class="head-tools">
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false">🌙 Dark</button>
      <button class="icon-btn js-cart-open" type="button" aria-label="Open your cart">
        Cart <span class="cart-count">0</span>
      </button>
      <button class="icon-btn burger" id="burger" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    </div>
  </div>
</header>

<main id="main">
{{BODY}}
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h4>Maggie's Collection</h4>
        <p style="color:inherit">Menswear, womenswear and unisex pieces, XS to 5XL, picked one at a time for Kimana, Oloitokitok and everywhere the matatu goes.</p>
        <a class="btn btn--rose" id="waDirect" href="{{PREFIX}}delivery.html" target="_blank" rel="noopener">Message us on WhatsApp</a>
      </div>
      <div>
        <h4>Shop</h4>
        <ul class="foot-list">
          <li><a href="{{PREFIX}}catalogue.html?c=dresses">Dresses</a></li>
          <li><a href="{{PREFIX}}catalogue.html?c=tops">Tops and shirts</a></li>
          <li><a href="{{PREFIX}}catalogue.html?c=menswear">Menswear</a></li>
          <li><a href="{{PREFIX}}catalogue.html?c=ankara">Ankara and prints</a></li>
          <li><a href="{{PREFIX}}catalogue.html?c=bags">Bags</a></li>
          <li><a href="{{PREFIX}}catalogue.html?c=shoes">Shoes</a></li>
        </ul>
      </div>
      <div>
        <h4>Know before you buy</h4>
        <ul class="foot-list">
          <li><a href="{{PREFIX}}delivery.html">Delivery and payment</a></li>
          <li><a href="{{PREFIX}}size-guide.html">Size guide</a></li>
          <li><a href="{{PREFIX}}delivery.html#returns">Returns</a></li>
          <li><a href="{{PREFIX}}admin/admin.html">Staff sign in</a></li>
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

<aside class="drawer" id="cartDrawer" aria-label="Your cart">
  <div class="drawer__head">
    <h3>Your cart</h3>
    <button class="icon-btn" id="cartClose" type="button">Close</button>
  </div>
  <div class="drawer__body">
    <p class="form-msg" id="cartNote"></p>
    <div id="cartLines"></div>

    <form id="checkoutForm" novalidate style="margin-top:1.4rem">
      <h3 style="font-size:1.1rem">Where is it going?</h3>
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
    <div class="totals"><span>Total to pay</span><b id="grandTotal">KSh 0</b></div>
    <button class="btn btn--solid btn--wide" id="toCheckout" type="submit" form="checkoutForm" disabled>Send order</button>
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
<script src="{{PREFIX}}js/theme.js"></script>
<script src="{{PREFIX}}js/config.js"></script>
<script src="{{PREFIX}}js/faq.js"></script>
<script src="{{PREFIX}}js/script.js"></script>
</body>
</html>
"""

ADMIN_SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Staff desk — Maggie's Collection</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#FDF8F3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E1216" media="(prefers-color-scheme: dark)">
<script>(function(){try{var t=localStorage.getItem("maggies_theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Karla:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css">
<link rel="stylesheet" href="admin.css">
</head>
<body>

<button class="icon-btn theme-fab" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false">🌙 Dark</button>

<section class="gate" id="gate">
  <h1>Staff desk</h1>
  <p>Sign in to manage the rail and today's orders.</p>
  <form id="gateForm" novalidate>
    <label class="field"><span>Email</span><input id="email" type="email" autocomplete="username" required></label>
    <label class="field">
      <span>Password</span>
      <span class="pw-wrap">
        <input id="password" type="password" autocomplete="current-password" required>
        <button type="button" class="pw-toggle" id="pwToggle" aria-label="Show password" aria-pressed="false">Show</button>
      </span>
    </label>
    <p class="admin-msg" id="gateMsg"></p>
    <button class="btn btn--solid btn--wide" type="submit">Sign in</button>
  </form>
  <p style="margin-top:1.2rem"><a href="../index.html">Back to the shop</a></p>
</section>

<div class="admin-shell" id="desk" hidden>
  <div class="admin-bar">
    <h1>Staff desk</h1>
    <div>
      <span class="admin-who" id="who"></span>
      <button class="mini" id="signOut" type="button">Sign out</button>
    </div>
  </div>

  <div class="tabs">
    <button class="tab is-active" type="button" data-pane="products">Products</button>
    <button class="tab" type="button" data-pane="orders">Orders</button>
  </div>

  <section class="pane is-active" id="pane-products">
    <div class="panel">
      <h2>Add or edit a product</h2>
      <p class="admin-msg" id="productMsg"></p>
      <form id="productForm" novalidate>
        <div class="two-col">
          <label class="field"><span>Name</span><input id="pName" type="text" required></label>
          <label class="field"><span>Price in KSh</span><input id="pPrice" type="number" min="0" step="10" required></label>
          <label class="field"><span>Category</span><select id="pCategory"></select></label>
          <label class="field"><span>Sort order, lower shows first</span><input id="pSort" type="number" value="0"></label>
        </div>
        <label class="field"><span>One line about it</span><input id="pDescription" type="text"></label>
        <label class="field"><span>Image link</span><input id="pImage" type="url"></label>
        <label class="field">
          <span>Sizes, separated by commas</span>
          <input id="pSizes" type="text" placeholder="S, M, L, XL">
        </label>
        <p class="row__meta" style="margin:-0.5rem 0 0.9rem">
          Letters (XS&ndash;5XL) for most items · numbers (28&ndash;46) for men's trousers · Small, Medium, Large, Suitcase for bags
        </p>
        <label class="field" style="display:flex;gap:0.5rem;align-items:center">
          <input id="pActive" type="checkbox" checked style="width:auto"><span style="margin:0">Show on the rail</span>
        </label>
        <div class="row__acts">
          <button class="btn btn--solid" id="saveProduct" type="submit">Add product</button>
          <button class="btn btn--ghost" id="cancelEdit" type="button" hidden>Cancel</button>
        </div>
      </form>
    </div>

    <div class="panel">
      <h2>On the rail</h2>
      <div id="productList"></div>
    </div>
  </section>

  <section class="pane" id="pane-orders">
    <div class="panel">
      <h2>Orders</h2>
      <p class="admin-msg" id="orderMsg"></p>
      <div class="row__acts" style="margin-bottom:1rem">
        <select class="mini" id="orderFilter"></select>
        <button class="mini" id="refreshOrders" type="button">Refresh</button>
      </div>
      <div id="orderList"></div>
    </div>
  </section>
</div>

<script src="{{SUPABASE_CDN}}"></script>
<script src="../js/theme.js"></script>
<script src="../js/config.js"></script>
<script src="admin.js"></script>
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
      <h1 class="hero__title">Clothes that survive the road to Kimana.</h1>
      <p class="hero__lead">We posses the style you prefer in Town. We pick every piece considering all taste of beauty with both latest fashions and heritage fashions , and what you see here is what is hanging in the shop this morning.</p>
      <div class="hero__actions">
        <a class="btn btn--solid" href="catalogue.html">See what is in</a>
        <a class="btn btn--ghost" href="size-guide.html">Find your size</a>
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
      <h2>A Dressing store that answers All Designs.</h2>
      <p>You are buying from a Unified botique polaour, not a warehouse. That means the hem can be taken up before the piece leaves, the colour you saw is the colour that arrives, and somebody remembers what you bought last time.</p>
      <p>Message us and The Fashion Team answers. If they are cought up with  customers it takes a few minutes, not a few days.</p>
    </div>
    <ul class="note-list reveal">
      <li><b>Alterations are free</b><br>Hems and waists on anything bought here, usually done the same day.</li>
      <li><b>We hold pieces</b><br>24 hours with nothing down, five days with half paid.</li>
      <li><b>Delivery reaches you</b><br>Free in town, boda to Oloitokitok, courier to Nairobi.</li>
      <li><b>Exchanges are simple</b><br><span id="returnDays">3</span> days with tags on, no argument.</li>
      <li><b>Every size, every body</b><br>XS to 5XL on one rail, nothing shut off by gender.</li>
    </ul>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>Browse by rail</h2>
    <div class="grid" style="margin-top:1.2rem">
      <a class="card" href="catalogue.html?c=dresses"><div class="card__body"><h3 class="card__name">Dresses</h3><p class="card__desc">Church, office and occasion.</p></div></a>
      <a class="card" href="catalogue.html?c=tops"><div class="card__body"><h3 class="card__name">Tops and shirts</h3><p class="card__desc">Everyday layers for anyone.</p></div></a>
      <a class="card" href="catalogue.html?c=bottoms"><div class="card__body"><h3 class="card__name">Trousers and skirts</h3><p class="card__desc">Cuts that hold their shape.</p></div></a>
      <a class="card" href="catalogue.html?c=menswear"><div class="card__body"><h3 class="card__name">Menswear</h3><p class="card__desc">Shirts, trousers, jackets.</p></div></a>
      <a class="card" href="catalogue.html?c=ankara"><div class="card__body"><h3 class="card__name">Ankara and prints</h3><p class="card__desc">Tailored here in Kimana.</p></div></a>
      <a class="card" href="catalogue.html?c=bags"><div class="card__body"><h3 class="card__name">Bags</h3><p class="card__desc">Carry-everything to going-out.</p></div></a>
      <a class="card" href="catalogue.html?c=shoes"><div class="card__body"><h3 class="card__name">Shoes</h3><p class="card__desc">Flats, heels and sandals.</p></div></a>
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
<section class="section--tight">
  <div class="wrap">
    <h1 style="margin-top:1.5rem">The rail today</h1>
    <p>Everything below is in the shop right now, menswear and womenswear on the same rail, XS through 5XL. Pick a size, add it to your cart, and send the order straight to WhatsApp.</p>
  </div>
  <div class="wrap">
    <div class="chips" id="chips"></div>
  </div>
  <div class="wrap" id="catalogue">
    <div class="state">Loading the rail…</div>
  </div>
</section>
"""

DELIVERY_BODY = """
<section class="section--tight">
  <div class="wrap">
    <h1 style="margin-top:1.5rem">Delivery, payment and returns</h1>
    <p>No surprises at the door. Here is exactly what it costs to get a parcel to you, how to pay, and what happens if something does not fit.</p>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <h2>Where we deliver</h2>
    <div class="table-scroll" id="zoneTable"></div>
    <p style="margin-top:1rem">Spend over <span id="freeFrom">KSh 5,000</span> and delivery is free wherever you are.</p>
  </div>
</section>

<section class="section section--shell">
  <div class="wrap split">
    <div>
      <h2>Paying</h2>
      <p>M-Pesa is the main option. Confirm the number with us on WhatsApp before you send anything, then share the confirmation message so we can match it to your order.</p>
      <p id="mpesaLine"></p>
      <p>Cash works for hand deliveries inside town. Orders leaving Kimana are paid before the parcel does.</p>
    </div>
    <div>
      <h2 id="returns">Returns and exchanges</h2>
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
    <p>One rail, XS to 5XL, nothing shut off by gender. Measure over light clothing, keep the tape flat, and breathe normally. If you are between two sizes, take the larger one and we will take it in for free.</p>
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
    <p style="margin-top:1rem">Hemming is free on anything bought here. Tell us the shoes you will wear them with and the tailor sets the length to match.</p>
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
        "title": "Maggie's Collection — clothing for everyone in Kimana Town",
        "desc": "Menswear, womenswear and unisex clothing, XS to 5XL, picked by hand in Kimana Town beside Zawadi Hotel. Free alterations, delivery across Kajiado South, order on WhatsApp.",
        "body": INDEX_BODY,
    },
    {
        "file": "catalogue.html",
        "title": "Catalogue — Maggie's Collection",
        "desc": "Everything hanging in Maggie's Collection today, sorted by category, with sizes and prices.",
        "body": CATALOGUE_BODY,
    },
    {
        "file": "delivery.html",
        "title": "Delivery, payment and returns — Maggie's Collection",
        "desc": "Delivery fees across Kimana, Oloitokitok, Emali and Nairobi, how to pay by M-Pesa, and how exchanges work.",
        "body": DELIVERY_BODY,
    },
    {
        "file": "size-guide.html",
        "title": "Size guide — Maggie's Collection",
        "desc": "Chest, bust, waist, hip and shoe measurements in centimetres, XS to 5XL, so you order the right size the first time.",
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
    html = html.replace("{{EXTRA_HEAD}}", page.get("head", ""))
    html = html.replace("{{NAV}}", build_nav(page["file"], prefix))
    html = html.replace("{{BODY}}", page["body"].strip())
    html = html.replace("{{PREFIX}}", prefix)
    html = html.replace("{{SUPABASE_CDN}}", SUPABASE_CDN)
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
    write("admin/admin.html", ADMIN_SHELL.replace("{{SUPABASE_CDN}}", SUPABASE_CDN))
    print("done — %d pages" % (len(PAGES) + 1))


if __name__ == "__main__":
    main()
