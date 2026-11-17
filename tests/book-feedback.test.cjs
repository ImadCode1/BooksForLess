/* global __dirname */
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the local flow and its rendered elements without adding a native test runtime.
function setup(options = {}) {
  const cache = new Map();
  const navigation = [];
  const deletionRequests = [];
  const clipboardWrites = [];
  let sharedTickets = options.tickets ?? [options.ticket ?? ticket];
  const hooks = new Map();
  let hookIndex = 0;
  let rendering = false;
  let params = {};
  let booleanState = false;
  let ratingState;
  let coverLoaded = false;
  let coverFailed = false;
  let motionListener;
  const React = require('react');
  const TabTrigger = Object.assign((props) => React.createElement('NativeTabTrigger', props), {
    Label: 'TabLabel', Icon: 'TabIcon',
  });
  const mocks = {
    react: {
      ...require('react'),
      useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
      useEffect: (effect) => {
        const index = hookIndex++;
        if (!hooks.has(index)) { hooks.set(index, true); effect(); }
      },
      useRef: (initial) => {
        const index = hookIndex++;
        if (!hooks.has(index)) hooks.set(index, { current: initial });
        return hooks.get(index);
      },
      useState: (initial) => {
        if (rendering) {
          const index = hookIndex++;
          if (!hooks.has(index)) hooks.set(index, initial);
          return [hooks.get(index), (next) => {
            hooks.set(index, typeof next === 'function' ? next(hooks.get(index)) : next);
          }];
        }
        return [
          typeof initial === 'boolean' ? booleanState : (initial === null || typeof initial === 'number') && ratingState !== undefined ? ratingState : initial,
          (next) => {
            if (typeof initial === 'boolean') booleanState = typeof next === 'function' ? next(booleanState) : next;
            else if (initial === null || typeof initial === 'number') ratingState = next;
          },
        ];
      },
    },
    'react-native': {
      View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', FlatList: 'FlatList',
      useColorScheme: () => options.scheme ?? 'light',
      useWindowDimensions: () => ({ width: options.width ?? 375, height: 812, fontScale: options.fontScale ?? 1 }),
      AccessibilityInfo: {
        isReduceMotionEnabled: async () => options.reduceMotion ?? false,
        addEventListener: (_event, listener) => {
          motionListener = listener;
          return { remove: () => {} };
        },
      },
      StyleSheet: { create: (styles) => styles },
      Platform: { select: (values) => values.default },
    },
    'expo-router': {
      DarkTheme: {}, DefaultTheme: {}, ThemeProvider: 'ThemeProvider',
      Stack: Object.assign((props) => React.createElement('Stack', props), { Screen: 'StackScreen' }),
      useLocalSearchParams: () => params,
      router: {
        push: (route) => navigation.push(route),
        navigate: (route) => navigation.push(route),
        dismissTo: (route) => navigation.push(route),
        canGoBack: () => true,
        back: () => navigation.push('back'),
        setParams: (next) => { params = { ...params, ...next }; },
      },
    },
    'expo-router/react-navigation': { useHeaderHeight: () => 64 },
    'expo-symbols': { SymbolView: 'SymbolView' },
    'expo-image': { Image: 'Image' },
    'expo-clipboard': { setStringAsync: async (value) => {
      clipboardWrites.push(value);
      return options.copyReference ? options.copyReference(value) : true;
    } },
    'expo-splash-screen': { preventAutoHideAsync: () => {}, hideAsync: async () => {} },
    'expo-router/native-tabs': {
      NativeTabs: Object.assign((props) => React.createElement('NativeTabs', props), { Trigger: TabTrigger }),
    },
    '@expo/ui/community/segmented-control': { SegmentedControl: 'SegmentedControl' },
    'react-native-screens/experimental': { SafeAreaView: 'SafeAreaView' },
    'react-native-qrcode-svg': { __esModule: true, default: 'QRCode' },
    'react-native-svg': {
      __esModule: true, default: 'Svg', Defs: 'Defs', LinearGradient: 'LinearGradient', Mask: 'Mask', Rect: 'Rect', Stop: 'Stop', Path: 'Path', Circle: 'Circle',
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: options.bottomInset ?? 0, left: 0, right: 0 }) },
    '@/components/logo': { Logo: 'Logo' },
    '@/services/covers': {
      useBookCover: (book) => ({
        uri: coverFailed ? undefined : book.coverUrl ?? `cover:${book.isbn}`,
        loaded: coverLoaded,
        loading: !coverLoaded && !coverFailed,
        onLoad: () => { coverLoaded = true; },
        onError: () => { coverFailed = true; coverLoaded = false; },
      }),
    },
    '@/components/book-flow/cover-placeholder': { CoverPlaceholder: (props) => React.createElement('CoverPlaceholder', props) },
    '@/components/book-flow/dev-menu': { DevMenu: 'DevMenu' },
    '@/components/book-flow/onboarding': { OnboardingProvider: 'OnboardingProvider', useOnboarding: () => ({ replay: () => {}, resetOnNextLaunch: async () => {} }) },
    '@/components/book-flow/ticket-provider': { TicketProvider: 'TicketProvider', useTickets: () => ({
      tickets: sharedTickets, loading: options.loading ?? false, error: options.error ?? null, refresh: async () => { await options.refresh?.(); },
      removeTicket: async (id) => {
        deletionRequests.push(id);
        await options.removeTicket?.(id);
        sharedTickets = sharedTickets.filter((item) => item.id !== id);
      },
    }) },
    '@/components/book-flow/ui': {
      palette: { accentText: 'blue', muted: 'gray', ink: 'black', soft: 'lightgray', paper: 'white', background: 'white', danger: 'red' },
      ui: { button: { backgroundColor: 'blue' }, card: { borderRadius: 20 } },
      ActionButton: (props) => require('react').createElement('ActionButton', props),
    },
  };
  function load(relative) {
    let filename = path.resolve(__dirname, '..', relative);
    if (!path.extname(filename)) filename += existsSync(`${filename}.tsx`) ? '.tsx' : '.ts';
    if (filename === path.resolve(__dirname, '../src/components/book-flow/ui.tsx')) {
      return mocks['@/components/book-flow/ui'];
    }
    if (filename === path.resolve(__dirname, '../src/components/book-flow/cover-placeholder.tsx')) {
      return mocks['@/components/book-flow/cover-placeholder'];
    }
    if (filename === path.resolve(__dirname, '../src/components/book-flow/dev-menu.tsx')) {
      return mocks['@/components/book-flow/dev-menu'];
    }
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    cache.set(filename, module.exports);
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const localRequire = (name) => {
      if (mocks[name]) return mocks[name];
      if (name.startsWith('@/')) return load(`src/${name.slice(2)}`);
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name));
      return require(name);
    };
    new Function('require', 'module', 'exports', '__DEV__', output)(localRequire, module, module.exports, options.dev ?? false);
    return module.exports;
  }
  return {
    load, navigation, deletionRequests, clipboardWrites, setParams: (next) => { params = next; },
    changeReducedMotion: (value) => motionListener(value),
    render: (Component) => {
      hookIndex = 0;
      rendering = true;
      try { return elements(Component()); }
      finally { rendering = false; }
    },
  };
}

function elements(element) {
  if (element === null || element === undefined || typeof element === 'boolean') return [];
  if (Array.isArray(element)) return element.flatMap(elements);
  if (typeof element !== 'object') return [element];
  if (typeof element.type === 'function') return elements(element.type(element.props));
  return [element, ...elements(element.props?.children)];
}
const text = (nodes) => nodes.filter((node) => typeof node === 'string' || typeof node === 'number').join(' ');
const hasQr = (nodes) => nodes.some((node) => node.type === 'QRCode');
const ticket = { id: 'test-sale', book: { title: 'Test textbook', isbn: '9780132350884' }, condition: 'Good', priceCents: 2400 };

test('sale QR disappears on completion before a review and returns after undo', () => {
  const { load } = setup();
  const feedback = load('src/services/book-feedback.ts');
  const { TicketCard } = load('src/components/book-flow/ticket-card.tsx');
  assert.equal(hasQr(elements(TicketCard({ ticket }))), true);
  feedback.setBookCompleted('sale:test-sale', true);
  const completed = elements(TicketCard({ ticket }));
  assert.equal(hasQr(completed), false);
  assert.doesNotMatch(text(completed), /Keep this ticket/);
  feedback.setBookCompleted('sale:test-sale', false);
  assert.equal(hasQr(elements(TicketCard({ ticket }))), true);
});

test('received purchases hide the QR action and the QR on a previously opened pickup route', () => {
  const { load, setParams } = setup();
  const { addOrder } = load('src/services/orders.ts');
  const order = addOrder({ title: 'Test textbook', isbn: '9780132350884', condition: 'Good', price: 24 });
  const { LibraryBookCard } = load('src/components/book-flow/library-book-card.tsx');
  const PickupScreen = load('src/app/pickup/[id].tsx').default;
  const feedback = load('src/services/book-feedback.ts');
  const item = { kind: 'purchase', order };
  setParams({ id: order.id });
  assert.match(text(elements(LibraryBookCard({ item }))), /View pickup QR/);
  assert.equal(hasQr(elements(PickupScreen())), true);
  feedback.setBookCompleted(`purchase:${order.id}`, true);
  assert.doesNotMatch(text(elements(LibraryBookCard({ item }))), /View pickup QR/);
  assert.equal(hasQr(elements(PickupScreen())), false);
  assert.match(text(elements(PickupScreen())), /Book received/);
  feedback.setBookCompleted(`purchase:${order.id}`, false);
  assert.equal(hasQr(elements(PickupScreen())), true);
});

test('rated sales and purchases move to History with compact ratings, edit action and no QR', () => {
  const { load } = setup();
  const feedback = load('src/services/book-feedback.ts');
  const { selectLibraryItems } = load('src/utils/my-books.ts');
  const { LibraryBookCard } = load('src/components/book-flow/library-book-card.tsx');
  const order = { id: 'test-purchase', isbn: '9780132350884', title: 'Purchased textbook', condition: 'Good', price: 24 };
  feedback.setBookCompleted('sale:test-sale', true);
  assert.equal(selectLibraryItems([ticket], [order], feedback.getBookFeedbackSnapshot(), 'history').length, 0);
  for (const [kind, id] of [['sale', ticket.id], ['purchase', order.id]]) {
    feedback.setBookCompleted(`${kind}:${id}`, true);
    feedback.rateBookExperience(`${kind}:${id}`, 4);
  }
  const history = selectLibraryItems([ticket], [order], feedback.getBookFeedbackSnapshot(), 'history');
  assert.equal(history.length, 2);
  for (const item of history) {
    const nodes = elements(LibraryBookCard({ item }));
    assert.equal(hasQr(nodes), false);
    assert.match(text(nodes), /4\s*\/5/);
    assert.match(text(nodes), /Edit/);
    assert.doesNotMatch(text(nodes), /View pickup QR|Keep this ticket/);
    assert.ok(nodes.some((node) => node.props?.accessibilityLabel?.includes('Your review: 4 out of 5 stars')));
  }
  feedback.setBookCompleted('sale:test-sale', false);
  assert.equal(feedback.getBookFeedback('sale:test-sale').rating, null);
  assert.equal(selectLibraryItems([ticket], [order], feedback.getBookFeedbackSnapshot(), 'history').length, 1);
});

test('compact Selling cards show cover metadata and status, omit QR and open details', () => {
  const { load, navigation } = setup();
  const { LibraryBookCard } = load('src/components/book-flow/library-book-card.tsx');
  const feedback = load('src/services/book-feedback.ts');
  const item = { kind: 'sale', ticket: { ...ticket, book: { ...ticket.book, authors: ['Test author'] }, status: 'Awaiting drop-off' } };
  let nodes = elements(LibraryBookCard({ item, section: 'selling' }));
  assert.equal(hasQr(nodes), false);
  assert.doesNotMatch(text(nodes), /Show QR|Hide QR|Mark as sold/);
  assert.match(text(nodes), /Test textbook.*Test author.*\$24\.00 CAD.*Good/);
  assert.doesNotMatch(text(nodes), /Keep this ticket|QR ticket|View book details|Awaiting drop-off/);
  assert.ok(nodes.find((node) => node.type === 'Image'));
  assert.ok(nodes.find((node) => node.type === 'SymbolView' && node.props.name.ios === 'chevron.right'));
  assert.equal(nodes.some((node) => node.type === 'Text' && node.props.children === ticket.id), false);
  const card = nodes[0];
  assert.equal(card.type, 'Pressable');
  assert.equal(card.props.accessibilityRole, 'button');
  assert.equal(card.props.style({ pressed: false })[0].padding, 12);
  assert.match(card.props.accessibilityLabel, /Test author/);
  assert.doesNotMatch(card.props.accessibilityLabel, /Awaiting drop-off/);
  const cover = nodes.find((node) => node.props?.testID === 'book-cover-thumbnail');
  assert.equal(cover.props.style.height, undefined);
  assert.equal(cover.props.style.alignSelf, 'stretch');
  assert.equal(nodes.find((node) => node.type === 'Image').props.contentFit, 'cover');
  card.props.onPress();
  assert.deepEqual(navigation.pop(), { pathname: '/listing/[id]', params: { id: ticket.id } });
  feedback.setBookCompleted('sale:test-sale', true);
  nodes = elements(LibraryBookCard({ item, section: 'selling' }));
  assert.equal(hasQr(nodes), false);
  assert.equal(nodes[0].type, 'Pressable');
  assert.match(text(nodes), /Sold/);
  assert.doesNotMatch(text(nodes), /Show QR|Hide QR|Undo|Mark as sold/);
});

test('library card titles truncate normally and reflow for large text without inventing authors or status', () => {
  const title = 'A long textbook title '.repeat(8);
  for (const fontScale of [1, 2]) {
    const { load } = setup({ width: 320, fontScale });
    const { LibraryBookCard } = load('src/components/book-flow/library-book-card.tsx');
    const nodes = elements(LibraryBookCard({ item: { kind: 'sale', ticket: { ...ticket, book: { ...ticket.book, title } } } }));
    const titleNode = nodes.find((node) => node.type === 'Text' && node.props.children === title);
    assert.equal(titleNode.props.numberOfLines, fontScale === 1 ? 2 : undefined);
    assert.equal(titleNode.props.ellipsizeMode, 'tail');
    assert.match(nodes[0].props.accessibilityLabel, new RegExp(title));
    assert.equal(nodes.some((node) => node.props?.testID === 'listing-status-badge'), false);
    assert.equal(hasQr(nodes), false);
    assert.doesNotMatch(text(nodes), /undefined|Listed|Dropped off/);
  }
});

test('all library empty states use real navigation and no QR placeholders', () => {
  for (const section of ['purchases', 'selling', 'history']) {
    const { load, navigation } = setup();
    const { LibraryEmptyState } = load('src/components/book-flow/library-empty-state.tsx');
    const nodes = elements(LibraryEmptyState({ section }));
    assert.equal(nodes[0].props.testID, `library-empty-${section}`);
    assert.equal(hasQr(nodes), false);
    nodes.find((node) => node.type === 'Pressable').props.onPress();
    if (section === 'history') {
      const list = elements(load('src/app/(tabs)/my-books.tsx').default()).find((node) => node.type === 'FlatList');
      assert.equal(list.key, 'selling');
    } else {
      assert.equal(navigation.pop(), section === 'selling' ? '/scan' : '/');
    }
  }
});

test('My Books removes the demo caption, preserves refresh, and separates loading/error from empty', async () => {
  let refreshes = 0;
  for (const state of ['loading', 'error', 'empty']) {
    const { load, setParams } = setup({ tickets: [], loading: state === 'loading', error: state === 'error' ? 'Offline' : null, refresh: async () => { refreshes++; } });
    setParams({ tab: 'selling' });
    const nodes = elements(load('src/app/(tabs)/my-books.tsx').default());
    const list = nodes.find((node) => node.type === 'FlatList');
    assert.doesNotMatch(text(elements(list.props.ListHeaderComponent)), /Shared demo collection|Confirmations stay/);
    assert.equal(list.props.contentContainerStyle[1].paddingBottom, 24);
    if (state === 'loading') {
      assert.ok(elements(list.props.ListEmptyComponent).find((node) => node.props?.accessibilityLabel === 'Loading shared books'));
    } else if (state === 'error') {
      assert.equal(list.props.ListEmptyComponent, undefined);
      elements(list.props.ListHeaderComponent).find((node) => node.props?.title === 'Retry loading books').props.onPress();
    } else {
      assert.ok(elements(list.props.ListEmptyComponent).find((node) => node.props?.testID === 'library-empty-selling'));
      list.props.onRefresh();
    }
    setParams({ tab: 'purchases' });
    const purchases = elements(load('src/app/(tabs)/my-books.tsx').default()).find((node) => node.type === 'FlatList');
    assert.equal(purchases.props.onRefresh, undefined);
    assert.ok(elements(purchases.props.ListEmptyComponent).find((node) => node.props?.testID === 'library-empty-purchases'));
  }
  await settle();
  assert.equal(refreshes, 2);
});

test('My Books uses a compact native segmented header and a plain settings icon', () => {
  const { load } = setup({ scheme: 'dark', dev: true });
  const nodes = elements(load('src/app/(tabs)/my-books.tsx').default());
  const header = nodes.find((node) => node.props?.testID === 'my-books-header');
  assert.equal(header.props.style[1].gap, 8);
  assert.equal(header.props.style[1].paddingBottom, 8);
  assert.equal(nodes.find((node) => node.type === 'DevMenu').props.plain, true);
  const sections = nodes.find((node) => node.props?.testID === 'my-books-sections');
  assert.equal(sections.props.style.minHeight, 44);
  assert.equal(sections.props.appearance, 'dark');
  assert.deepEqual(sections.props.values, ['Purchases', 'Selling', 'History']);
});

const listingTicket = {
  ...ticket, id: 'BFL-TEST-LISTING',
  book: { ...ticket.book, authors: ['Test author'], source: 'demo' },
  status: 'Awaiting drop-off',
};
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('listing details show book information and route Mark as sold to explicit confirmation', () => {
  const { load, render, setParams, navigation } = setup({ ticket: listingTicket });
  setParams({ id: listingTicket.id });
  const Screen = load('src/app/listing/[id].tsx').default;
  const nodes = render(Screen);
  assert.match(text(nodes), /Test textbook.*Test author.*Good.*\$24\.00 CAD.*Awaiting drop-off.*ISBN.*9780132350884.*Co-op drop-off ticket/);
  assert.doesNotMatch(text(nodes), /Shared demo listing|Keep this ticket/);
  assert.match(text(nodes), /proposed campus co-op/);
  assert.equal(hasQr(nodes), true);
  const testActions = nodes.find((node) => node.props?.testID === 'listing-test-actions');
  assert.match(text(elements(testActions)), /Testing only.*Mark as sold/);
  const saleButton = elements(testActions).find((node) => node.type === 'Pressable' && text(elements(node)) === 'Mark as sold');
  saleButton.props.onPress();
  assert.deepEqual(navigation.pop(), {
    pathname: '/review', params: { id: listingTicket.id, kind: 'sale', title: listingTicket.book.title },
  });
});

test('listing details keep ticket and secondary actions in one safe-area-aware scroll view', () => {
  const { load, render, setParams } = setup({ ticket: listingTicket, bottomInset: 34 });
  setParams({ id: listingTicket.id });
  const Screen = load('src/app/listing/[id].tsx').default;
  const nodes = render(Screen);
  const scroll = nodes.find((node) => node.props?.testID === 'listing-details-scroll');
  assert.equal(scroll.props.contentInsetAdjustmentBehavior, 'automatic');
  assert.equal(nodes[0].props.collapsable, false);
  assert.equal(scroll.props.contentContainerStyle[1].paddingBottom, 54);
  assert.equal(nodes.some((node) => node.props?.testID === 'listing-action-bar'), false);
  assert.equal(nodes.filter((node) => node.type === 'ScrollView').length, 1);
  assert.equal(elements(scroll).some((node) => node.props?.testID === 'listing-actions'), true);
  assert.equal(nodes.some((node) => node.props?.title === 'Back to My Books'), false);
});

test('listing groups status with ISBN and separates the two header information groups vertically', () => {
  const { load, render, setParams } = setup({ ticket: listingTicket });
  setParams({ id: listingTicket.id });
  const nodes = render(load('src/app/listing/[id].tsx').default);
  const metadata = nodes.find((node) => node.props?.testID === 'listing-metadata');
  assert.match(text(elements(metadata)), /Listing status.*Awaiting drop-off.*ISBN.*9780132350884/);
  const information = nodes.find((node) => node.props?.testID === 'listing-book-information');
  assert.equal(information.props.style.justifyContent, 'space-between');
  assert.equal(information.props.style.alignSelf, 'stretch');
  assert.equal(information.props.children.length, 2);
  assert.match(text(elements(information.props.children[0])), /Test textbook.*Test author/);
  assert.match(text(elements(information.props.children[1])), /Good.*\$24\.00 CAD/);
});

test('listing uses a minimal native back button and non-overlapping header', () => {
  const { load, render } = setup();
  const nodes = render(load('src/app/_layout.tsx').default);
  const options = nodes.find((node) => node.props?.name === 'listing/[id]').props.options;
  assert.equal(options.title, 'Book details');
  assert.equal(options.headerBackButtonDisplayMode, 'minimal');
  assert.equal(options.headerTransparent, false);
  assert.equal(options.scrollEdgeEffects.top, 'hidden');
});

test('listing surfaces and text adapt to dark and light appearance', () => {
  for (const scheme of ['light', 'dark']) {
    const { load, render, setParams } = setup({ scheme, ticket: listingTicket });
    setParams({ id: listingTicket.id });
    const nodes = render(load('src/app/listing/[id].tsx').default);
    const backgroundColor = scheme === 'dark' ? '#0C0D10' : '#F2F2F7';
    assert.equal(nodes[0].props.style[1].backgroundColor, backgroundColor);
    assert.equal(nodes.find((node) => node.props?.testID === 'listing-qr-section').props.style.backgroundColor, scheme === 'dark' ? '#1B1C21' : '#FFFFFF');
    const title = nodes.find((node) => node.type === 'Text' && node.props.children === listingTicket.book.title);
    assert.equal(title.props.style[1].color, scheme === 'dark' ? '#F5F5F7' : '#182C50');
    const isbn = nodes.find((node) => node.type === 'Text' && node.props.children === listingTicket.book.isbn);
    assert.equal(isbn.props.style[1].color, title.props.style[1].color);
  }
});

test('actual cover has no blur or animation, and failure leaves metadata and a placeholder', () => {
  for (const scheme of ['light', 'dark']) {
    const { load, render } = setup({ scheme });
    const { ListingBookHero } = load('src/components/book-flow/listing-book-hero.tsx');
    const Hero = () => ListingBookHero({ ticket: listingTicket });
    let nodes = render(Hero);
    const image = nodes.find((node) => node.props?.testID === 'listing-book-cover');
    assert.equal(image.props.blurRadius, undefined);
    assert.equal(image.props.contentFit, 'contain');
    assert.equal(image.props.accessibilityLabel, `Cover of ${listingTicket.book.title}`);
    assert.equal(image.props.transition, 0);
    assert.equal(nodes.some((node) => node.type === 'LinearGradient'), false);
    image.props.onError();
    nodes = render(Hero);
    assert.equal(nodes.some((node) => node.type === 'Image'), false);
    assert.equal(nodes.some((node) => node.type === 'CoverPlaceholder'), true);
    assert.match(text(nodes), /Test textbook.*Test author.*Good/);
  }
});

test('long book titles stay on one line and clip overflow while preserving the accessible title', () => {
  const longTicket = { ...listingTicket, book: { ...listingTicket.book, title: 'A very long textbook title '.repeat(8), authors: [] } };
  const { load, render } = setup({ width: 320, fontScale: 2 });
  const { ListingBookHero } = load('src/components/book-flow/listing-book-hero.tsx');
  const nodes = render(() => ListingBookHero({ ticket: longTicket }));
  const title = nodes.find((node) => node.type === 'Text' && node.props.children === longTicket.book.title);
  assert.equal(title.props.numberOfLines, 1);
  assert.equal(title.props.ellipsizeMode, 'clip');
  assert.equal(title.props.style[1].overflow, 'hidden');
  assert.equal(title.props.accessibilityLabel, longTicket.book.title);
  assert.equal(title.props.allowFontScaling, undefined);
  assert.equal(title.props.style[1].fontSize, 22);
  assert.equal(nodes[0].props.style.flexDirection, 'column');
});

test('ticket QR payload, contrast and quiet zone are unchanged', () => {
  const { load, render } = setup();
  const nodes = render(() => load('src/components/book-flow/listing-drop-off-ticket.tsx').ListingDropOffTicket({ ticket: listingTicket }));
  const qr = nodes.find((node) => node.type === 'QRCode');
  assert.equal(qr.props.value, `booksforless:ticket:${listingTicket.id}`);
  assert.equal(qr.props.quietZone, 18);
  assert.equal(qr.props.size, 180);
  assert.equal(qr.props.color, '#000000');
  assert.equal(qr.props.backgroundColor, '#FFFFFF');
  const card = nodes.find((node) => node.props?.testID === 'listing-qr-section');
  const group = nodes.find((node) => node.props?.testID === 'ticket-code-group');
  assert.equal(group.props.style.gap, card.props.style.gap);
  assert.equal(group.props.style.gap, 24);
});

test('copy reference writes the stable ID, never the QR payload, and reports success', async () => {
  const { load, render, clipboardWrites } = setup();
  const Ticket = () => load('src/components/book-flow/listing-drop-off-ticket.tsx').ListingDropOffTicket({ ticket: listingTicket });
  render(Ticket).find((node) => node.props?.testID === 'copy-ticket-reference').props.onPress();
  await settle();
  assert.deepEqual(clipboardWrites, [listingTicket.id]);
  assert.match(text(render(Ticket)), /Reference copied/);
});

test('clipboard rejection and false results offer retry without a false success', async () => {
  for (const failure of ['throw', 'false']) {
    let fail = true;
    const { load, render, clipboardWrites } = setup({ copyReference: async () => {
      if (fail && failure === 'throw') throw new Error('Clipboard unavailable');
      return !fail;
    } });
    const Ticket = () => load('src/components/book-flow/listing-drop-off-ticket.tsx').ListingDropOffTicket({ ticket: listingTicket });
    render(Ticket).find((node) => node.props?.testID === 'copy-ticket-reference').props.onPress();
    await settle();
    assert.match(text(render(Ticket)), /Could not copy/);
    assert.doesNotMatch(text(render(Ticket)), /Reference copied/);
    fail = false;
    render(Ticket).find((node) => node.props?.testID === 'copy-ticket-reference').props.onPress();
    await settle();
    assert.equal(clipboardWrites.length, 2);
    assert.match(text(render(Ticket)), /Reference copied/);
  }
});

test('pending clipboard writes cannot be duplicated', async () => {
  let finish;
  const { load, render, clipboardWrites } = setup({ copyReference: () => new Promise((resolve) => { finish = resolve; }) });
  const Ticket = () => load('src/components/book-flow/listing-drop-off-ticket.tsx').ListingDropOffTicket({ ticket: listingTicket });
  const copy = render(Ticket).find((node) => node.props?.testID === 'copy-ticket-reference');
  copy.props.onPress();
  copy.props.onPress();
  assert.equal(clipboardWrites.length, 1);
  assert.equal(render(Ticket).find((node) => node.props?.testID === 'copy-ticket-reference').props.disabled, true);
  finish(true);
  await settle();
  assert.match(text(render(Ticket)), /Reference copied/);
});

test('status display supports future values without adding progress or mutating tickets', () => {
  const { load, render } = setup();
  const { ListingStatus } = load('src/components/book-flow/listing-status.tsx');
  for (const status of ['Awaiting drop-off', 'Listed', 'Dropped off', 'Sold']) {
    assert.match(text(render(() => ListingStatus({ status }))), new RegExp(status));
  }
  assert.equal(listingTicket.status, 'Awaiting drop-off');
});

test('confirmed sale hides the ticket and cancellation while review and undo remain functional', () => {
  const { load, render, setParams, navigation } = setup({ ticket: listingTicket });
  setParams({ id: listingTicket.id });
  const feedback = load('src/services/book-feedback.ts');
  feedback.setBookCompleted(`sale:${listingTicket.id}`, true);
  const Screen = load('src/app/listing/[id].tsx').default;
  let nodes = render(Screen);
  assert.equal(hasQr(nodes), false);
  assert.match(text(elements(nodes.find((node) => node.props?.testID === 'listing-status'))), /Sold/);
  assert.equal(nodes.some((node) => node.props?.testID === 'cancel-listing'), false);
  nodes.find((node) => node.props?.accessibilityLabel === `Leave a review for ${listingTicket.book.title}`).props.onPress();
  assert.equal(navigation.pop().pathname, '/review');
  nodes.find((node) => node.props?.accessibilityLabel === 'Undo sold confirmation').props.onPress();
  nodes = render(Screen);
  assert.equal(hasQr(nodes), true);
  assert.match(text(elements(nodes.find((node) => node.props?.testID === 'listing-status'))), /Awaiting drop-off/);
});

test('loading and failed listing fetches retain a way out and a retry', async () => {
  let retries = 0;
  for (const loading of [true, false]) {
    const { load, render, setParams } = setup({ tickets: [], loading, error: loading ? null : 'Offline', refresh: async () => { retries++; } });
    setParams({ id: listingTicket.id });
    const nodes = render(load('src/app/listing/[id].tsx').default);
    assert.equal(hasQr(nodes), false);
    assert.ok(nodes.find((node) => node.props?.title === 'Back to My Books'));
    if (loading) {
      assert.ok(nodes.find((node) => node.props?.accessibilityLabel === 'Loading listing'));
      assert.doesNotMatch(text(nodes), /Listing not found/);
    } else {
      assert.match(text(nodes), /Could not load listing.*Offline/);
      nodes.find((node) => node.props?.title === 'Try again').props.onPress();
      await settle();
    }
  }
  assert.equal(retries, 1);
});

test('cancel listing requires confirmation, Keep listing is safe, and deletion returns to My Books', async () => {
  const { load, render, setParams, deletionRequests, navigation } = setup({ ticket: listingTicket });
  setParams({ id: listingTicket.id });
  const Screen = load('src/app/listing/[id].tsx').default;
  let nodes = render(Screen);
  nodes.find((node) => node.type === 'Pressable' && text(elements(node)) === 'Cancel listing').props.onPress();
  nodes = render(Screen);
  assert.match(text(nodes), /permanently deletes.*shared demo collection for everyone/);
  assert.equal(deletionRequests.length, 0);
  nodes.find((node) => node.type === 'Pressable' && text(elements(node)) === 'Keep listing').props.onPress();
  assert.equal(render(Screen).some((node) => node.props?.testID === 'delete-listing'), false);
  assert.equal(deletionRequests.length, 0);
  nodes = render(Screen);
  nodes.find((node) => node.type === 'Pressable' && text(elements(node)) === 'Cancel listing').props.onPress();
  nodes = render(Screen);
  const confirm = nodes.find((node) => node.props?.testID === 'delete-listing');
  confirm.props.onPress();
  confirm.props.onPress();
  assert.equal(render(Screen).find((node) => node.props?.testID === 'delete-listing').props.disabled, true);
  await settle();
  assert.deepEqual(deletionRequests, [listingTicket.id]);
  assert.deepEqual(navigation.pop(), { pathname: '/my-books', params: { tab: 'selling' } });
  assert.match(text(render(Screen)), /Listing not found/);
});

test('failed cancellation keeps the listing and offers a retry', async () => {
  let fail = true;
  const { load, render, setParams, deletionRequests, navigation } = setup({
    ticket: listingTicket,
    removeTicket: async () => { if (fail) throw new Error('offline'); },
  });
  setParams({ id: listingTicket.id });
  const Screen = load('src/app/listing/[id].tsx').default;
  render(Screen).find((node) => node.type === 'Pressable' && text(elements(node)) === 'Cancel listing').props.onPress();
  render(Screen).find((node) => node.props?.testID === 'delete-listing').props.onPress();
  await settle();
  let nodes = render(Screen);
  assert.match(text(nodes), /Could not cancel this listing/);
  assert.equal(hasQr(nodes), true);
  assert.equal(navigation.length, 0);
  fail = false;
  nodes.find((node) => node.props?.testID === 'delete-listing').props.onPress();
  await settle();
  assert.equal(deletionRequests.length, 2);
  assert.equal(navigation.length, 1);
});

test('missing or malformed listing IDs cannot offer sale or delete actions', () => {
  const { load, render, setParams } = setup({ ticket: listingTicket });
  const Screen = load('src/app/listing/[id].tsx').default;
  for (const id of ['invalid', 'BFL-MISSING-LISTING', undefined]) {
    setParams({ id });
    const nodes = render(Screen);
    assert.match(text(nodes), /Listing not found/);
    assert.doesNotMatch(text(nodes), /Mark as sold|Cancel listing|Delete listing/);
    assert.equal(hasQr(nodes), false);
  }
});

test('My Books owns its safe area and keeps its header outside the scrolling list after Review back', () => {
  const { load, setParams, navigation } = setup();
  const tabs = elements(load('src/components/app-tabs.tsx').default());
  assert.equal(tabs.find((node) => node.props?.name === 'my-books').props.disableAutomaticContentInsets, true);
  const MyBooksScreen = load('src/app/(tabs)/my-books.tsx').default;
  const ReviewScreen = load('src/app/review.tsx').default;
  const { BookCompletion } = load('src/components/book-flow/book-completion.tsx');
  const feedback = load('src/services/book-feedback.ts');
  setParams({ tab: 'selling' });
  const assertLayout = () => {
    const screen = MyBooksScreen();
    assert.deepEqual(screen.props.edges, { top: true, bottom: true, left: true, right: true });
    assert.equal(screen.props.children[0].props.testID, 'my-books-header');
    const nodes = elements(screen);
    const list = nodes.find((node) => node.props?.testID === 'my-books-list');
    assert.equal(list.props.contentInsetAdjustmentBehavior, 'never');
    assert.equal(list.props.automaticallyAdjustContentInsets, false);
    assert.equal(list.props.automaticallyAdjustsScrollIndicatorInsets, false);
    assert.equal(list.key, 'selling');
    assert.equal(nodes.find((node) => node.props?.testID === 'my-books-sections').props.selectedIndex, 1);
    assert.doesNotMatch(text(elements(list.props.ListHeaderComponent)), /My Books/);
  };
  assertLayout();
  const completion = elements(BookCompletion({ id: ticket.id, kind: 'sale', title: ticket.book.title }));
  completion.find((node) => node.props?.title === 'Mark as sold').props.onPress();
  const route = navigation.at(-1);
  setParams(route.params);
  const review = elements(ReviewScreen());
  review.find((node) => node.type === 'Pressable' && node.props.children?.props?.children === 'Not now').props.onPress();
  assert.equal(navigation.at(-1), 'back');
  setParams({ tab: 'selling' });
  assertLayout();
  assert.equal(feedback.getBookFeedback(`sale:${ticket.id}`).completed, false);
  assert.equal(feedback.getBookFeedback(`sale:${ticket.id}`).rating, null);
  feedback.confirmBookCompletion(`sale:${ticket.id}`, 4);
  const sections = elements(MyBooksScreen()).find((node) => node.props?.testID === 'my-books-sections');
  sections.props.onChange({ nativeEvent: { selectedSegmentIndex: 2 } });
  const history = elements(MyBooksScreen()).find((node) => node.props?.testID === 'my-books-list');
  assert.equal(history.key, 'history');
  assert.equal(history.props.data.length, 1);
  sections.props.onChange({ nativeEvent: { selectedSegmentIndex: 0 } });
  const purchases = elements(MyBooksScreen()).find((node) => node.props?.testID === 'my-books-list');
  assert.equal(purchases.key, 'purchases');
});

test('Review preselects an existing rating, saves it to History and supports skipping', () => {
  const { load, setParams, navigation } = setup();
  const feedback = load('src/services/book-feedback.ts');
  const ReviewScreen = load('src/app/review.tsx').default;
  setParams({ id: 'missing', kind: 'sale' });
  assert.match(text(elements(ReviewScreen())), /Book not found/);
  setParams({ id: ticket.id, kind: 'sale' });
  feedback.setBookCompleted('sale:test-sale', true);
  let nodes = elements(ReviewScreen());
  assert.equal(nodes[0].props.contentContainerStyle[1].paddingBottom, 8);
  const ratingSection = nodes.find((node) => node.props?.testID === 'review-rating-section');
  assert.equal(ratingSection.props.style.flex, 1);
  assert.equal(ratingSection.props.style.justifyContent, 'center');
  assert.equal(ratingSection.props.style.alignItems, 'center');
  assert.equal(nodes.find((node) => node.props?.testID === 'review-actions').props.style.marginTop, 'auto');
  assert.equal(nodes.find((node) => node.props?.title === 'Save review').props.disabled, true);
  nodes.find((node) => node.type === 'Pressable' && node.props.children?.props?.children === 'Not now').props.onPress();
  assert.equal(feedback.getBookFeedback('sale:test-sale').rating, null);
  assert.equal(navigation.at(-1), 'back');
  feedback.rateBookExperience('sale:test-sale', 4);
  nodes = elements(ReviewScreen());
  assert.equal(nodes.find((node) => node.props?.testID === 'rating-4').props.accessibilityState.checked, true);
  nodes.find((node) => node.props?.title === 'Save changes').props.onPress();
  assert.deepEqual(navigation.at(-1), { pathname: '/my-books', params: { tab: 'history' } });
});

for (const kind of ['sale', 'purchase']) {
  function reviewContext() {
    const context = setup();
    const { load } = context;
    const book = kind === 'sale' ? ticket : load('src/services/orders.ts').addOrder({
      isbn: ticket.book.isbn, title: ticket.book.title, condition: 'Good', price: 24,
    });
    const { BookCompletion } = load('src/components/book-flow/book-completion.tsx');
    const action = elements(BookCompletion({ id: book.id, kind, title: ticket.book.title }))
      .find((node) => node.props?.title === (kind === 'sale' ? 'Mark as sold' : 'Mark as received'));
    assert.equal(action.props.secondary, true);
    action.props.onPress();
    context.setParams(context.navigation.at(-1).params);
    return {
      ...context,
      key: `${kind}:${book.id}`,
      feedback: load('src/services/book-feedback.ts'),
      ReviewScreen: load('src/app/review.tsx').default,
    };
  }

  test(`${kind}: opening Review and returning without confirmation never completes the book`, () => {
    const { feedback, key, ReviewScreen, navigation } = reviewContext();
    assert.deepEqual(feedback.getBookFeedback(key), { completed: false, rating: null });
    let nodes = elements(ReviewScreen());
    nodes.find((node) => node.props?.testID === 'rating-3').props.onPress();
    nodes = elements(ReviewScreen());
    assert.deepEqual(feedback.getBookFeedback(key), { completed: false, rating: null });
    nodes.find((node) => node.type === 'Pressable' && node.props.children?.props?.children === 'Not now').props.onPress();
    assert.equal(navigation.at(-1), 'back');
    assert.deepEqual(feedback.getBookFeedback(key), { completed: false, rating: null });
  });

  test(`${kind}: explicit confirmation commits the status and selected rating together`, () => {
    const { feedback, key, ReviewScreen, navigation } = reviewContext();
    elements(ReviewScreen()).find((node) => node.props?.testID === 'rating-4').props.onPress();
    const save = elements(ReviewScreen()).find((node) => node.props?.title === 'Confirm & save review');
    assert.equal(save.props.disabled, false);
    save.props.onPress();
    assert.deepEqual(feedback.getBookFeedback(key), { completed: true, rating: 4 });
    assert.deepEqual(navigation.at(-1), { pathname: '/my-books', params: { tab: 'history' } });
  });

  test(`${kind}: confirmation without a rating keeps the review optional`, () => {
    const { feedback, key, ReviewScreen, navigation } = reviewContext();
    const confirm = elements(ReviewScreen()).find((node) => node.props?.title === (kind === 'sale' ? 'Confirm sale' : 'Confirm receipt'));
    assert.equal(confirm.props.disabled, false);
    confirm.props.onPress();
    assert.deepEqual(feedback.getBookFeedback(key), { completed: true, rating: null });
    assert.deepEqual(navigation.at(-1), { pathname: '/my-books', params: { tab: kind === 'sale' ? 'selling' : 'purchases' } });
  });
}

test('cancelling a review edit preserves the previously confirmed status and rating', () => {
  const { load, setParams } = setup();
  const feedback = load('src/services/book-feedback.ts');
  feedback.confirmBookCompletion(`sale:${ticket.id}`, 4);
  setParams({ kind: 'sale', id: ticket.id });
  const ReviewScreen = load('src/app/review.tsx').default;
  elements(ReviewScreen()).find((node) => node.props?.testID === 'rating-1').props.onPress();
  elements(ReviewScreen()).find((node) => node.type === 'Pressable' && node.props.children?.props?.children === 'Cancel').props.onPress();
  assert.deepEqual(feedback.getBookFeedback(`sale:${ticket.id}`), { completed: true, rating: 4 });
});

test('invalid confirmation ratings cannot mutate local feedback', () => {
  const { load } = setup();
  const feedback = load('src/services/book-feedback.ts');
  const snapshot = feedback.getBookFeedbackSnapshot();
  for (const rating of [0, 6, 2.5, NaN]) {
    assert.equal(feedback.confirmBookCompletion(`sale:${ticket.id}`, rating), false);
    assert.equal(feedback.getBookFeedbackSnapshot(), snapshot);
  }
});

test('My Books shows cover thumbnails with a fixed-size loading and failure placeholder', () => {
  const { load } = setup();
  const { BookCoverThumbnail } = load('src/components/book-flow/book-cover-thumbnail.tsx');
  const props = { isbn: '978-0-13235088-4', title: ticket.book.title, coverUrl: 'https://example.com/cover.jpg' };
  let nodes = elements(BookCoverThumbnail(props));
  assert.equal(nodes[0].props.style.width, 64);
  assert.equal(nodes[0].props.style.height, 96);
  let image = nodes.find((node) => node.type === 'Image');
  assert.equal(image.props.source.uri, props.coverUrl);
  assert.equal(image.props.contentFit, 'contain');
  assert.equal(nodes.find((node) => node.type === 'CoverPlaceholder').props.loading, true);
  image.props.onLoad();
  nodes = elements(BookCoverThumbnail(props));
  assert.equal(nodes.some((node) => node.type === 'CoverPlaceholder'), false);
  image = nodes.find((node) => node.type === 'Image');
  image.props.onError();
  nodes = elements(BookCoverThumbnail(props));
  assert.equal(nodes.some((node) => node.type === 'Image'), false);
  assert.equal(nodes.find((node) => node.type === 'CoverPlaceholder').props.loading, false);
  assert.equal(nodes[0].props.style.height, 96);

  const { load: freshLoad } = setup();
  const card = freshLoad('src/components/book-flow/library-book-card.tsx').LibraryBookCard;
  const cardNodes = elements(card({ item: { kind: 'sale', ticket } }));
  assert.equal(cardNodes.find((node) => node.type === 'Image').props.source.uri, `cover:${ticket.book.isbn}`);
});

test('star choices expose the selected rating and report a new selection', () => {
  const { load } = setup();
  const { RatingStars } = load('src/components/book-flow/rating-stars.tsx');
  let selected = 2;
  const nodes = elements(RatingStars({ rating: selected, onChange: (value) => { selected = value; } }));
  const chosen = nodes.find((node) => node.props?.testID === 'rating-2');
  const unchosen = nodes.find((node) => node.props?.testID === 'rating-5');
  assert.equal(chosen.props.accessibilityState.checked, true);
  assert.equal(unchosen.props.accessibilityState.checked, false);
  assert.equal(chosen.props.style({ pressed: false }).borderColor, 'blue');
  assert.equal(unchosen.props.style({ pressed: false }).backgroundColor, 'transparent');
  assert.equal(unchosen.props.style({ pressed: true }).backgroundColor, 'lightgray');
  unchosen.props.onPress();
  assert.equal(selected, 5);
});

test('main-page logo sits beside a left-aligned heading', () => {
  const { load } = setup();
  const nodes = elements(load('src/components/pages/TopBar.tsx').default());
  assert.equal(nodes[0].props.style.flexDirection, 'row');
  assert.equal(nodes[1].type, 'Logo');
  assert.equal(nodes[0].props.style.marginTop, 18);
  assert.equal(nodes[1].props.size, 60);
  const heading = nodes.find((node) => node.props?.accessibilityRole === 'header');
  assert.equal(heading.props.style.textAlign, 'left');
  assert.match(text(nodes), /Your next read is just a search away/);
});
