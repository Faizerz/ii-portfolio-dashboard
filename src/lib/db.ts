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
