import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'portfolio.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema();
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: Database.Database) {
  // Check if isin column exists, if not add it
  const holdingsColumns = database
    .prepare("PRAGMA table_info(holdings)")
    .all() as Array<{ name: string }>;
  const columnNames = holdingsColumns.map((c) => c.name);

  if (!columnNames.includes('isin')) {
    database.exec('ALTER TABLE holdings ADD COLUMN isin TEXT');
    console.log('Added isin column to holdings table');
  }

  if (!columnNames.includes('morningstar_id')) {
    database.exec('ALTER TABLE holdings ADD COLUMN morningstar_id TEXT');
    console.log('Added morningstar_id column to holdings table');
  }

  // Check if fund_holdings table exists, if not create it
  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fund_holdings'")
    .all() as Array<{ name: string }>;

  if (tables.length === 0) {
    database.exec(`
      CREATE TABLE fund_holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fund_symbol TEXT NOT NULL,
        holding_symbol TEXT,
        holding_name TEXT NOT NULL,
        cusip TEXT,
        isin TEXT,
        asset_type TEXT,
        weight_percent REAL NOT NULL,
        shares_held REAL,
        market_value REAL,
        as_of_date TEXT NOT NULL,
        fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fund_symbol, holding_symbol, as_of_date)
      );
      CREATE INDEX idx_fund_holdings_symbol ON fund_holdings(fund_symbol);
      CREATE INDEX idx_fund_holdings_date ON fund_holdings(fund_symbol, as_of_date);
    `);
    console.log('Created fund_holdings table');
  }
}

function initializeSchema() {
  const database = db!;

  database.exec(`
    -- Current holdings from statement
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      sedol TEXT,
      isin TEXT,
      morningstar_id TEXT,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      book_cost REAL NOT NULL,
      current_price REAL,
      market_value REAL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(symbol)
    );

    -- Cached historical price data
    CREATE TABLE IF NOT EXISTS price_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      date TEXT NOT NULL,
      price REAL NOT NULL,
      UNIQUE(symbol, date)
    );

    CREATE INDEX IF NOT EXISTS idx_price_cache_symbol_date ON price_cache(symbol, date);

    -- Transactions from CSV imports
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      symbol TEXT NOT NULL,
      sedol TEXT,
      fund_name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      units REAL,
      price REAL,
      total REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, symbol, type, total, units)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

    -- Fund metadata
    CREATE TABLE IF NOT EXISTS funds (
      symbol TEXT PRIMARY KEY,
      sedol TEXT,
      name TEXT NOT NULL,
      yahoo_symbol TEXT,
      currency TEXT DEFAULT 'GBP'
    );
  `);
}

// Holdings
export function upsertHolding(holding: {
  symbol: string;
  sedol: string;
  isin?: string | null;
  morningstarId?: string | null;
  name: string;
  quantity: number;
  bookCost: number;
  currentPrice: number;
  marketValue: number;
}) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO holdings (symbol, sedol, isin, morningstar_id, name, quantity, book_cost, current_price, market_value, updated_at)
    VALUES (@symbol, @sedol, @isin, @morningstarId, @name, @quantity, @bookCost, @currentPrice, @marketValue, datetime('now'))
    ON CONFLICT(symbol) DO UPDATE SET
      sedol = @sedol,
      isin = COALESCE(@isin, isin),
      morningstar_id = COALESCE(@morningstarId, morningstar_id),
      name = @name,
      quantity = @quantity,
      book_cost = @bookCost,
      current_price = @currentPrice,
      market_value = @marketValue,
      updated_at = datetime('now')
  `);
  return stmt.run(holding);
}

export function getAllHoldings(): Array<{
  id: number;
  symbol: string;
  sedol: string;
  isin: string | null;
  morningstar_id: string | null;
  name: string;
  quantity: number;
  book_cost: number;
  current_price: number;
  market_value: number;
  updated_at: string;
}> {
  const database = getDb();
  return database.prepare('SELECT * FROM holdings ORDER BY market_value DESC').all() as Array<{
    id: number;
    symbol: string;
    sedol: string;
    isin: string | null;
    morningstar_id: string | null;
    name: string;
    quantity: number;
    book_cost: number;
    current_price: number;
    market_value: number;
    updated_at: string;
  }>;
}

export function clearHoldings() {
  const database = getDb();
  database.prepare('DELETE FROM holdings').run();
}

// Price cache
export function cachePrice(symbol: string, date: string, price: number) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO price_cache (symbol, date, price)
    VALUES (?, ?, ?)
  `);
  return stmt.run(symbol, date, price);
}

export function cachePricesBatch(prices: Array<{ symbol: string; date: string; price: number }>) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO price_cache (symbol, date, price)
    VALUES (@symbol, @date, @price)
  `);

  const insertMany = database.transaction((data: typeof prices) => {
    for (const p of data) {
      stmt.run(p);
    }
  });

  insertMany(prices);
}

export function getCachedPrices(symbol: string): Array<{ date: string; price: number }> {
  const database = getDb();
  return database.prepare(`
    SELECT date, price FROM price_cache WHERE symbol = ? ORDER BY date ASC
  `).all(symbol) as Array<{ date: string; price: number }>;
}

export function getLatestCachedDate(symbol: string): string | null {
  const database = getDb();
  const result = database.prepare(`
    SELECT MAX(date) as latest FROM price_cache WHERE symbol = ?
  `).get(symbol) as { latest: string | null };
  return result?.latest || null;
}

export function clearPriceCache() {
  const database = getDb();
  database.prepare('DELETE FROM price_cache').run();
}

export function getEarliestPriceDate(): string | null {
  const database = getDb();
  const result = database.prepare(`
    SELECT MIN(date) as earliest FROM price_cache
  `).get() as { earliest: string | null };
  return result?.earliest || null;
}

// Transaction functions
export interface Transaction {
  id?: number;
  date: string;
  symbol: string;
  sedol?: string;
  fund_name: string;
  type: string;
  description?: string;
  units?: number;
  price?: number;
  total: number;
  created_at?: string;
}

export function insertTransaction(tx: Omit<Transaction, 'id' | 'created_at'>) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO transactions (date, symbol, sedol, fund_name, type, description, units, price, total)
    VALUES (@date, @symbol, @sedol, @fund_name, @type, @description, @units, @price, @total)
  `);
  return stmt.run(tx);
}

export function insertTransactionsBatch(transactions: Array<Omit<Transaction, 'id' | 'created_at'>>) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO transactions (date, symbol, sedol, fund_name, type, description, units, price, total)
    VALUES (@date, @symbol, @sedol, @fund_name, @type, @description, @units, @price, @total)
  `);

  const insertMany = database.transaction((data: typeof transactions) => {
    let inserted = 0;
    for (const tx of data) {
      const result = stmt.run(tx);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  return insertMany(transactions);
}

export function getAllTransactions(): Transaction[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM transactions ORDER BY date DESC, id DESC
  `).all() as Transaction[];
}

export function getTransactionsBySymbol(symbol: string): Transaction[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM transactions WHERE symbol = ? ORDER BY date DESC, id DESC
  `).all(symbol) as Transaction[];
}

export function getTransactionTypes(): string[] {
  const database = getDb();
  const result = database.prepare(`
    SELECT DISTINCT type FROM transactions ORDER BY type
  `).all() as Array<{ type: string }>;
  return result.map(r => r.type);
}

export function getTransactionSymbols(): Array<{ symbol: string; fund_name: string }> {
  const database = getDb();
  return database.prepare(`
    SELECT DISTINCT symbol, fund_name FROM transactions ORDER BY fund_name
  `).all() as Array<{ symbol: string; fund_name: string }>;
}

export function clearTransactions() {
  const database = getDb();
  database.prepare('DELETE FROM transactions').run();
}

// Fund metadata functions
export function upsertFund(fund: { symbol: string; sedol?: string; name: string; yahoo_symbol?: string }) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO funds (symbol, sedol, name, yahoo_symbol)
    VALUES (@symbol, @sedol, @name, @yahoo_symbol)
    ON CONFLICT(symbol) DO UPDATE SET
      sedol = @sedol,
      name = @name,
      yahoo_symbol = COALESCE(@yahoo_symbol, yahoo_symbol)
  `);
  return stmt.run(fund);
}

export function getFund(symbol: string): { symbol: string; sedol: string; name: string; yahoo_symbol: string; currency: string } | undefined {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM funds WHERE symbol = ?
  `).get(symbol) as { symbol: string; sedol: string; name: string; yahoo_symbol: string; currency: string } | undefined;
}

export function getAllFunds(): Array<{ symbol: string; sedol: string; name: string; yahoo_symbol: string; currency: string }> {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM funds ORDER BY name
  `).all() as Array<{ symbol: string; sedol: string; name: string; yahoo_symbol: string; currency: string }>;
}

// Get a single holding by symbol
export function getHolding(symbol: string): {
  id: number;
  symbol: string;
  sedol: string;
  isin: string | null;
  morningstar_id: string | null;
  name: string;
  quantity: number;
  book_cost: number;
  current_price: number;
  market_value: number;
  updated_at: string;
} | undefined {
  const database = getDb();
  return database.prepare('SELECT * FROM holdings WHERE symbol = ?').get(symbol) as {
    id: number;
    symbol: string;
    sedol: string;
    isin: string | null;
    morningstar_id: string | null;
    name: string;
    quantity: number;
    book_cost: number;
    current_price: number;
    market_value: number;
    updated_at: string;
  } | undefined;
}

// Update Morningstar ID for a holding
export function updateHoldingMorningstarId(symbol: string, morningstarId: string) {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE holdings SET morningstar_id = ? WHERE symbol = ?
  `);
  return stmt.run(morningstarId, symbol);
}

// Fund Holdings (underlying positions)
export interface FundHoldingRow {
  id?: number;
  fund_symbol: string;
  holding_symbol?: string | null;
  holding_name: string;
  cusip?: string | null;
  isin?: string | null;
  asset_type?: string | null;
  weight_percent: number;
  shares_held?: number | null;
  market_value?: number | null;
  as_of_date: string;
  fetched_at?: string;
}

export function cacheFundHoldingsBatch(holdings: Array<Omit<FundHoldingRow, 'id' | 'fetched_at'>>) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO fund_holdings
      (fund_symbol, holding_symbol, holding_name, cusip, isin, asset_type, weight_percent, shares_held, market_value, as_of_date)
    VALUES
      (@fund_symbol, @holding_symbol, @holding_name, @cusip, @isin, @asset_type, @weight_percent, @shares_held, @market_value, @as_of_date)
  `);

  const insertMany = database.transaction((data: typeof holdings) => {
    for (const holding of data) {
      stmt.run(holding);
    }
  });

  insertMany(holdings);
}

export function getLatestFundHoldings(fundSymbol: string): FundHoldingRow[] {
  const database = getDb();

  // Get the most recent as_of_date for this fund
  const latestDateResult = database.prepare(`
    SELECT MAX(as_of_date) as latest_date FROM fund_holdings WHERE fund_symbol = ?
  `).get(fundSymbol) as { latest_date: string | null };

  if (!latestDateResult?.latest_date) {
    return [];
  }

  // Get all holdings for that date
  return database.prepare(`
    SELECT * FROM fund_holdings
    WHERE fund_symbol = ? AND as_of_date = ?
    ORDER BY weight_percent DESC
  `).all(fundSymbol, latestDateResult.latest_date) as FundHoldingRow[];
}

export function hasRecentHoldings(fundSymbol: string, maxAgeDays: number = 7): boolean {
  const database = getDb();

  const result = database.prepare(`
    SELECT MAX(fetched_at) as latest_fetch FROM fund_holdings WHERE fund_symbol = ?
  `).get(fundSymbol) as { latest_fetch: string | null };

  if (!result?.latest_fetch) {
    return false;
  }

  const fetchDate = new Date(result.latest_fetch);
  const now = new Date();
  const daysDiff = (now.getTime() - fetchDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff < maxAgeDays;
}

export function getFundsWithHoldings(): Array<{ fund_symbol: string; as_of_date: string; count: number }> {
  const database = getDb();

  return database.prepare(`
    SELECT
      fund_symbol,
      MAX(as_of_date) as as_of_date,
      COUNT(*) as count
    FROM fund_holdings
    GROUP BY fund_symbol
    ORDER BY fund_symbol
  `).all() as Array<{ fund_symbol: string; as_of_date: string; count: number }>;
}
