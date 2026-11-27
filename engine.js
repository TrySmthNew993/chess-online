/**
 * KnightLink Fast 0x88 Chess Engine
 * Iterative Deepening + Alpha-Beta + Zobrist TT + Null-Move Pruning + Quiescence + Tapered Eval
 * Calibrated to Chess.com-style ELO ratings (200 - 3200)
 */
(function (global) {
  'use strict';

  const EMPTY = 0;
  const WP = 1, WN = 2, WB = 3, WR = 4, WQ = 5, WK = 6;
  const BP = 9, BN = 10, BB = 11, BR = 12, BQ = 13, BK = 14;

  const WHITE = 0;
  const BLACK = 8;

  // Move flags
  const FLAG_CAPTURE = 1;
  const FLAG_EP = 2;
  const FLAG_CASTLE = 4;
  const FLAG_PAWN_DBL = 8;

  // Middlegame & Endgame piece values
  const MG_VAL = [0, 82, 337, 365, 477, 1025, 20000];
  const EG_VAL = [0, 94, 281, 297, 512, 936, 20000];
  const PHASE_WEIGHTS = [0, 0, 1, 1, 2, 4, 0]; // max phase = 24

  // PeSTO-inspired Middlegame & Endgame Piece-Square Tables (White perspective, row 0 = rank 8)
  const MG_PST = [
    null,
    // Pawn
    [
       0,   0,   0,   0,   0,   0,   0,   0,
      98, 134,  61,  95,  68, 126,  34, -11,
      -6,   7,  26,  31,  65,  56,  25, -20,
     -14,  13,   6,  21,  23,  12,  17, -23,
     -27,  -2,  -5,  12,  17,   6,  10, -25,
     -26,  -4,  -4, -10,   3,   3,  33, -12,
     -35,  -1, -20, -23, -15,  24,  38, -22,
       0,   0,   0,   0,   0,   0,   0,   0
    ],
    // Knight
    [
     -167, -89, -34, -49,  61, -97, -15, -107,
      -73, -41,  72,  36,  23,  62,   7,  -17,
      -47,  60,  37,  65,  84, 129,  73,   44,
       -9,  17,  19,  53,  37,  69,  18,   22,
      -13,   4,  16,  13,  28,  19,  21,   -8,
      -23,  -9,  12,  10,  19,  17,  25,  -16,
      -29, -53, -12,  -3,  -1,  18, -14,  -19,
     -105, -21, -58, -33, -17, -28, -19,  -23
    ],
    // Bishop
    [
     -29,   4, -82, -37, -25, -42,   7,  -8,
     -26,  16, -18, -13,  30,  59,  18, -47,
     -16,  37,  43,  40,  35,  50,  37,  -2,
      -4,   5,  19,  50,  37,  37,   7,  -2,
      -6,  13,  13,  26,  34,  12,  10,   4,
       0,  15,  15,  15,  14,  27,  18,  10,
       4,  15,  16,   0,   7,  21,  33,   1,
     -33,  -3, -14, -21, -13, -12, -39, -21
    ],
    // Rook
    [
      32,  42,  32,  51,  63,   9,  31,  43,
      27,  32,  58,  62,  80,  67,  26,  44,
      -5,  19,  26,  36,  17,  45,  61,  16,
     -24, -11,   7,  26,  24,  35,  -8, -20,
     -36, -26, -12,  -1,   9,  -7,   6, -23,
     -45, -25, -16, -17,   3,   0,  -5, -33,
     -44, -16, -20,  -9,  -1,  11,  -6, -71,
     -19, -13,   1,  17,  16,   7, -37, -26
    ],
    // Queen
    [
     -28,   0,  29,  12,  59,  44,  43,  45,
     -24, -39,  -5,   1, -16,  57,  28,  54,
     -13, -17,   7,   8,  29,  56,  47,  57,
     -27, -27, -16, -16,  -1,  17,  -2,   1,
      -9, -26,  -9, -10,  -2,  -4,   3,  -3,
     -14,   2, -11,  -2,  -5,   2,  14,   5,
     -35,  -8,  11,   2,   8,  15,  -3,   1,
      -1, -18,  -9,  10, -15, -25, -31, -50
    ],
    // King
    [
     -65,  23,  16, -15, -56, -34,   2,  13,
      29,  -1, -20,  -7,  -8,  -4, -38, -29,
      -9,  24,   2, -16, -20,   6,  22, -22,
     -17, -20, -12, -27, -30, -25, -14, -36,
     -49,  -1, -27, -39, -46, -44, -33, -51,
     -14, -14, -22, -46, -44, -30, -15, -27,
       1,   7,  -8, -64, -43, -16,   9,   8,
     -15,  36,  12, -54,   8, -28,  24,  14
    ]
  ];

  const EG_PST = [
    null,
    // Pawn
    [
       0,   0,   0,   0,   0,   0,   0,   0,
     178, 173, 158, 134, 147, 132, 165, 187,
      94, 100,  85,  67,  56,  53,  82,  84,
      32,  24,  13,   5,  -2,   4,  17,  17,
      13,   9,  -3,  -7,  -7,  -8,   3,  -1,
       4,   7,  -6,   1,   0,  -5,  -1,  -8,
      13,   8,   8,  10,  13,   0,   2,  -7,
       0,   0,   0,   0,   0,   0,   0,   0
    ],
    // Knight
    [
     -58, -38, -13, -28, -31, -27, -63, -99,
     -25,  -8, -25,  -2,  -9, -25, -24, -52,
     -24, -20,  10,   9,  -1,  -9, -19, -41,
     -17,   3,  22,  22,  22,  11,   8, -18,
     -18,  -6,  16,  25,  16,  17,   4, -18,
     -23,  -3,  -1,  15,  10,  -3, -20, -22,
     -42, -20, -10,  -5,  -2, -20, -23, -44,
     -29, -51, -23, -15, -22, -18, -50, -64
    ],
    // Bishop
    [
     -14, -21, -11,  -8,  -7,  -9, -17, -24,
      -8,  -4,   7, -12,  -3, -13,  -4, -14,
       2,  -8,   0,  -1,  -2,   6,   0,   4,
      -3,   9,  12,   9,  14,  10,   3,   2,
      -6,   3,  13,  19,   7,  10,  -3,  -9,
     -12,  -3,   8,  10,  13,   3,  -7, -15,
     -14, -18,  -7,  -1,   4,  -9, -15, -27,
     -23,  -9, -23,  -5,  -9, -16,  -5, -17
    ],
    // Rook
    [
      13,  10,  18,  15,  12,  12,   8,   5,
      11,  13,  13,  11,  -3,   3,   8,   3,
       7,   7,   7,   5,   4,  -3,  -5,  -3,
       4,   3,  13,   1,   2,   1,  -1,   2,
       3,   5,   8,   4,  -5,  -6,  -8, -11,
      -4,   0,  -5,  -1,  -7, -12,  -8, -16,
      -6,  -6,   0,   2,  -9,  -9, -11,  -3,
      -9,   2,   3,  -1,  -5, -13,   4, -20
    ],
    // Queen
    [
      -9,  22,  22,  27,  27,  19,  10,  20,
     -17,  20,  32,  41,  58,  25,  30,   0,
     -20,   6,   9,  49,  47,  35,  19,   9,
       3,  22,  24,  45,  57,  40,  57,  36,
     -18,  28,  19,  47,  31,  34,  39,  23,
     -16, -27,  15,   6,   9,  17,  10,   5,
     -22, -23, -30, -16, -16, -23, -36, -32,
     -33, -28, -22, -43,  -5, -32, -20, -41
    ],
    // King
    [
     -74, -35, -18, -18, -11,  15,   4, -17,
     -12,  17,  14,  17,  17,  38,  23,  11,
      10,  17,  23,  15,  20,  45,  44,  13,
      -8,  22,  24,  27,  26,  33,  26,   3,
     -18,  -4,  21,  24,  27,  23,   9, -11,
     -19,  -3,  11,  21,  23,  16,   7,  -9,
     -27, -11,   4,  13,  14,   4,  -5, -17,
     -53, -34, -21, -11, -28, -14, -24, -43
    ]
  ];

  // Move deltas in 0x88
  const KNIGHT_DIRS = [-33, -31, -18, -14, 14, 18, 31, 33];
  const BISHOP_DIRS = [-17, -15, 15, 17];
  const ROOK_DIRS   = [-16, -1, 1, 16];
  const KING_DIRS   = [-17, -16, -15, -1, 1, 15, 16, 17];

  // Deterministic Zobrist keys (hi & lo 32-bit ints)
  let rngState = 0x9e3779b9;
  function rand32() {
    rngState ^= rngState << 13;
    rngState ^= rngState >>> 17;
    rngState ^= rngState << 5;
    return rngState >>> 0;
  }

  const Z_PIECE_HI = new Uint32Array(16 * 128);
  const Z_PIECE_LO = new Uint32Array(16 * 128);
  for (let i = 0; i < 16 * 128; i++) {
    Z_PIECE_HI[i] = rand32();
    Z_PIECE_LO[i] = rand32();
  }
  const Z_SIDE_HI = rand32();
  const Z_SIDE_LO = rand32();
  const Z_CASTLE_HI = new Uint32Array(16);
  const Z_CASTLE_LO = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    Z_CASTLE_HI[i] = rand32();
    Z_CASTLE_LO[i] = rand32();
  }
  const Z_EP_HI = new Uint32Array(8);
  const Z_EP_LO = new Uint32Array(8);
  for (let i = 0; i < 8; i++) {
    Z_EP_HI[i] = rand32();
    Z_EP_LO[i] = rand32();
  }

  // Transposition Table (2^19 = 524,288 entries -> ~12 MB)
  const TT_SIZE = 1 << 19;
  const TT_MASK = TT_SIZE - 1;
  const TT_EXACT = 0;
  const TT_LOWER = 1;
  const TT_UPPER = 2;

  const ttKeyHi = new Uint32Array(TT_SIZE);
  const ttKeyLo = new Uint32Array(TT_SIZE);
  const ttDepth = new Int8Array(TT_SIZE);
  const ttFlag  = new Uint8Array(TT_SIZE);
  const ttScore = new Int32Array(TT_SIZE);
  const ttMove  = new Int32Array(TT_SIZE);

  // Compact opening book (keyed by piece-placement + side)
  const OPENING_BOOK = {
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w': ['e2e4', 'd2d4', 'c2c4', 'g1f3'],
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b': ['e7e5', 'c7c5', 'e7e6', 'c7c6'],
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b': ['d7d5', 'g8f6', 'e7e6'],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w': ['g1f3', 'f1c4', 'b1c3'],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b': ['b8c6', 'g8f6'],
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w': ['f1b5', 'f1c4', 'd2d4'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w': ['g1f3', 'b1c3', 'c2c3'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b': ['d7d6', 'b8c6', 'e7e6'],
    'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w': ['c2c4', 'g1f3', 'c1f4'],
    'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b': ['e7e6', 'c7c6', 'd5c4'],
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR/g8f6': ['c2c4', 'g1f3'],
    'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b': ['e7e6', 'g7g6', 'c7c5'],
    'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w': ['d2d4', 'd2d3'],
    'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w': ['d2d4', 'b1c3']
  };

  function sqToAlgebraic(sq) {
    const file = sq & 7;
    const rank = 8 - (sq >> 4);
    return String.fromCharCode(97 + file) + rank;
  }

  function algebraicToSq(str) {
    const file = str.charCodeAt(0) - 97;
    const rank = 8 - parseInt(str[1], 10);
    return (rank << 4) | file;
  }

  function encodeMove(from, to, promo, flags) {
    return from | (to << 8) | ((promo || 0) << 16) | ((flags || 0) << 20);
  }

  const M_FROM = (m) => m & 0xff;
  const M_TO = (m) => (m >> 8) & 0xff;
  const M_PROMO = (m) => (m >> 16) & 0xf;
  const M_FLAGS = (m) => (m >> 20) & 0xf;

  class FastBoard {
    constructor(fen) {
      this.board = new Int8Array(128);
      this.side = WHITE;
      this.castling = 0;
      this.epSq = -1;
      this.halfmove = 0;
      this.kingSq = [0, 0]; // index 0 = white, 1 = black
      this.hashHi = 0;
      this.hashLo = 0;
      this.undoStack = [];
      this.loadFen(fen);
    }

    loadFen(fen) {
      this.board.fill(0);
      const parts = fen.trim().split(/\s+/);
      const rows = parts[0].split('/');
      const map = {
        P: WP, N: WN, B: WB, R: WR, Q: WQ, K: WK,
        p: BP, n: BN, b: BB, r: BR, q: BQ, k: BK
      };

      for (let r = 0; r < 8; r++) {
        let c = 0;
        const rowStr = rows[r];
        for (let i = 0; i < rowStr.length; i++) {
          const ch = rowStr[i];
          if (ch >= '1' && ch <= '8') {
            c += parseInt(ch, 10);
          } else {
            const sq = (r << 4) | c;
            const p = map[ch];
            this.board[sq] = p;
            if (p === WK) this.kingSq[0] = sq;
            if (p === BK) this.kingSq[1] = sq;
            c++;
          }
        }
      }

      this.side = parts[1] === 'b' ? BLACK : WHITE;
      const cast = parts[2] || '-';
      this.castling = 0;
      if (cast.includes('K')) this.castling |= 1;
      if (cast.includes('Q')) this.castling |= 2;
      if (cast.includes('k')) this.castling |= 4;
      if (cast.includes('q')) this.castling |= 8;

      this.epSq = parts[3] && parts[3] !== '-' ? algebraicToSq(parts[3]) : -1;
      this.halfmove = parseInt(parts[4], 10) || 0;
      this.computeHash();
    }

    computeHash() {
      let hi = 0;
      let lo = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = (r << 4) | c;
          const p = this.board[sq];
          if (p) {
            const idx = (p << 7) | sq;
            hi ^= Z_PIECE_HI[idx];
            lo ^= Z_PIECE_LO[idx];
          }
        }
      }
      if (this.side === BLACK) {
        hi ^= Z_SIDE_HI;
        lo ^= Z_SIDE_LO;
      }
      hi ^= Z_CASTLE_HI[this.castling];
      lo ^= Z_CASTLE_LO[this.castling];
      if (this.epSq !== -1) {
        const f = this.epSq & 7;
        hi ^= Z_EP_HI[f];
        lo ^= Z_EP_LO[f];
      }
      this.hashHi = hi >>> 0;
      this.hashLo = lo >>> 0;
    }

    isSquareAttacked(sq, bySide) {
      const b = this.board;
      // Pawns
      if (bySide === WHITE) {
        const s1 = sq + 15;
        const s2 = sq + 17;
        if (!(s1 & 0x88) && b[s1] === WP) return true;
        if (!(s2 & 0x88) && b[s2] === WP) return true;
      } else {
        const s1 = sq - 17;
        const s2 = sq - 15;
        if (!(s1 & 0x88) && b[s1] === BP) return true;
        if (!(s2 & 0x88) && b[s2] === BP) return true;
      }

      // Knights
      const enemyKnight = bySide | 2;
      for (let i = 0; i < 8; i++) {
        const t = sq + KNIGHT_DIRS[i];
        if (!(t & 0x88) && b[t] === enemyKnight) return true;
      }

      // Kings
      const enemyKing = bySide | 6;
      for (let i = 0; i < 8; i++) {
        const t = sq + KING_DIRS[i];
        if (!(t & 0x88) && b[t] === enemyKing) return true;
      }

      // Diagonal sliders (Bishop / Queen)
      const enemyBishop = bySide | 3;
      const enemyQueen = bySide | 5;
      for (let i = 0; i < 4; i++) {
        const d = BISHOP_DIRS[i];
        let t = sq + d;
        while (!(t & 0x88)) {
          const p = b[t];
          if (p) {
            if (p === enemyBishop || p === enemyQueen) return true;
            break;
          }
          t += d;
        }
      }

      // Orthogonal sliders (Rook / Queen)
      const enemyRook = bySide | 4;
      for (let i = 0; i < 4; i++) {
        const d = ROOK_DIRS[i];
        let t = sq + d;
        while (!(t & 0x88)) {
          const p = b[t];
          if (p) {
            if (p === enemyRook || p === enemyQueen) return true;
            break;
          }
          t += d;
        }
      }

      return false;
    }

    inCheck(side = this.side) {
      const kSq = this.kingSq[side === WHITE ? 0 : 1];
      return this.isSquareAttacked(kSq, side ^ 8);
    }

    generateMoves(capturesOnly = false) {
      const moves = [];
      const b = this.board;
      const us = this.side;
      const them = us ^ 8;
      const pawnDir = us === WHITE ? -16 : 16;
      const startRank = us === WHITE ? 6 : 1;
      const promoRank = us === WHITE ? 0 : 7;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = (r << 4) | c;
          const p = b[sq];
          if (!p || (p & 8) !== us) continue;

          const type = p & 7;
          if (type === 1) {
            // Pawn
            const oneStep = sq + pawnDir;
            const targetRank = oneStep >> 4;
            if (!capturesOnly && !(oneStep & 0x88) && b[oneStep] === EMPTY) {
              if (targetRank === promoRank) {
                moves.push(encodeMove(sq, oneStep, 5, 0));
                moves.push(encodeMove(sq, oneStep, 4, 0));
                moves.push(encodeMove(sq, oneStep, 3, 0));
                moves.push(encodeMove(sq, oneStep, 2, 0));
              } else {
                moves.push(encodeMove(sq, oneStep, 0, 0));
                if (r === startRank) {
                  const twoStep = oneStep + pawnDir;
                  if (b[twoStep] === EMPTY) {
                    moves.push(encodeMove(sq, twoStep, 0, FLAG_PAWN_DBL));
                  }
                }
              }
            }

            // Pawn captures
            const capOffsets = [pawnDir - 1, pawnDir + 1];
            for (let i = 0; i < 2; i++) {
              const capSq = sq + capOffsets[i];
              if (capSq & 0x88) continue;
              const capP = b[capSq];
              if (capP && (capP & 8) === them) {
                if ((capSq >> 4) === promoRank) {
                  moves.push(encodeMove(sq, capSq, 5, FLAG_CAPTURE));
                  moves.push(encodeMove(sq, capSq, 4, FLAG_CAPTURE));
                  moves.push(encodeMove(sq, capSq, 3, FLAG_CAPTURE));
                  moves.push(encodeMove(sq, capSq, 2, FLAG_CAPTURE));
                } else {
                  moves.push(encodeMove(sq, capSq, 0, FLAG_CAPTURE));
                }
              } else if (capSq === this.epSq) {
                moves.push(encodeMove(sq, capSq, 0, FLAG_CAPTURE | FLAG_EP));
              }
            }
          } else if (type === 2) {
            // Knight
            for (let i = 0; i < 8; i++) {
              const t = sq + KNIGHT_DIRS[i];
              if (t & 0x88) continue;
              const tp = b[t];
              if (!tp) {
                if (!capturesOnly) moves.push(encodeMove(sq, t, 0, 0));
              } else if ((tp & 8) === them) {
                moves.push(encodeMove(sq, t, 0, FLAG_CAPTURE));
              }
            }
          } else if (type === 6) {
            // King
            for (let i = 0; i < 8; i++) {
              const t = sq + KING_DIRS[i];
              if (t & 0x88) continue;
              const tp = b[t];
              if (!tp) {
                if (!capturesOnly) moves.push(encodeMove(sq, t, 0, 0));
              } else if ((tp & 8) === them) {
                moves.push(encodeMove(sq, t, 0, FLAG_CAPTURE));
              }
            }

            // Castling
            if (!capturesOnly) {
              if (us === WHITE && sq === 0x74) {
                if ((this.castling & 1) && b[0x75] === EMPTY && b[0x76] === EMPTY && b[0x77] === WR) {
                  if (!this.isSquareAttacked(0x74, BLACK) && !this.isSquareAttacked(0x75, BLACK) && !this.isSquareAttacked(0x76, BLACK)) {
                    moves.push(encodeMove(0x74, 0x76, 0, FLAG_CASTLE));
                  }
                }
                if ((this.castling & 2) && b[0x73] === EMPTY && b[0x72] === EMPTY && b[0x71] === EMPTY && b[0x70] === WR) {
                  if (!this.isSquareAttacked(0x74, BLACK) && !this.isSquareAttacked(0x73, BLACK) && !this.isSquareAttacked(0x72, BLACK)) {
                    moves.push(encodeMove(0x74, 0x72, 0, FLAG_CASTLE));
                  }
                }
              } else if (us === BLACK && sq === 0x04) {
                if ((this.castling & 4) && b[0x05] === EMPTY && b[0x06] === EMPTY && b[0x07] === BR) {
                  if (!this.isSquareAttacked(0x04, WHITE) && !this.isSquareAttacked(0x05, WHITE) && !this.isSquareAttacked(0x06, WHITE)) {
                    moves.push(encodeMove(0x04, 0x06, 0, FLAG_CASTLE));
                  }
                }
                if ((this.castling & 8) && b[0x03] === EMPTY && b[0x02] === EMPTY && b[0x01] === EMPTY && b[0x00] === BR) {
                  if (!this.isSquareAttacked(0x04, WHITE) && !this.isSquareAttacked(0x03, WHITE) && !this.isSquareAttacked(0x02, WHITE)) {
                    moves.push(encodeMove(0x04, 0x02, 0, FLAG_CASTLE));
                  }
                }
              }
            }
          } else {
            // Sliders: Bishop(3), Rook(4), Queen(5)
            const dirs = type === 3 ? BISHOP_DIRS : type === 4 ? ROOK_DIRS : KING_DIRS;
            for (let i = 0; i < dirs.length; i++) {
              const d = dirs[i];
              let t = sq + d;
              while (!(t & 0x88)) {
                const tp = b[t];
                if (!tp) {
                  if (!capturesOnly) moves.push(encodeMove(sq, t, 0, 0));
                } else {
                  if ((tp & 8) === them) {
                    moves.push(encodeMove(sq, t, 0, FLAG_CAPTURE));
                  }
                  break;
                }
                t += d;
              }
            }
          }
        }
      }
      return moves;
    }

    makeMove(move) {
      const from = M_FROM(move);
      const to = M_TO(move);
      const promo = M_PROMO(move);
      const flags = M_FLAGS(move);
      const b = this.board;
      const piece = b[from];
      const captured = b[to];

      this.undoStack.push({
        move,
        captured,
        castling: this.castling,
        epSq: this.epSq,
        halfmove: this.halfmove,
        hashHi: this.hashHi,
        hashLo: this.hashLo,
        kingW: this.kingSq[0],
        kingB: this.kingSq[1]
      });

      let hi = this.hashHi;
      let lo = this.hashLo;

      // Remove old EP & castling from hash
      if (this.epSq !== -1) {
        const f = this.epSq & 7;
        hi ^= Z_EP_HI[f];
        lo ^= Z_EP_LO[f];
      }
      hi ^= Z_CASTLE_HI[this.castling];
      lo ^= Z_CASTLE_LO[this.castling];

      // Remove moving piece from `from`
      hi ^= Z_PIECE_HI[(piece << 7) | from];
      lo ^= Z_PIECE_LO[(piece << 7) | from];
      b[from] = EMPTY;

      // Remove captured piece if any
      if (captured) {
        hi ^= Z_PIECE_HI[(captured << 7) | to];
        lo ^= Z_PIECE_LO[(captured << 7) | to];
      }

      // EP capture removes enemy pawn
      if (flags & FLAG_EP) {
        const epCapSq = to + (this.side === WHITE ? 16 : -16);
        const epPawn = b[epCapSq];
        hi ^= Z_PIECE_HI[(epPawn << 7) | epCapSq];
        lo ^= Z_PIECE_LO[(epPawn << 7) | epCapSq];
        b[epCapSq] = EMPTY;
      }

      // Place piece (or promoted piece) at `to`
      const placed = promo ? (this.side | promo) : piece;
      b[to] = placed;
      hi ^= Z_PIECE_HI[(placed << 7) | to];
      lo ^= Z_PIECE_LO[(placed << 7) | to];

      if (piece === WK) this.kingSq[0] = to;
      if (piece === BK) this.kingSq[1] = to;

      // Castling rook move
      if (flags & FLAG_CASTLE) {
        let rFrom, rTo;
        if (to === 0x76) { rFrom = 0x77; rTo = 0x75; }
        else if (to === 0x72) { rFrom = 0x70; rTo = 0x73; }
        else if (to === 0x06) { rFrom = 0x07; rTo = 0x05; }
        else { rFrom = 0x00; rTo = 0x03; }
        const rook = b[rFrom];
        hi ^= Z_PIECE_HI[(rook << 7) | rFrom];
        lo ^= Z_PIECE_LO[(rook << 7) | rFrom];
        b[rFrom] = EMPTY;
        b[rTo] = rook;
        hi ^= Z_PIECE_HI[(rook << 7) | rTo];
        lo ^= Z_PIECE_LO[(rook << 7) | rTo];
      }

      // Update castling rights
      if (from === 0x74) this.castling &= ~3;
      if (from === 0x04) this.castling &= ~12;
      if (from === 0x77 || to === 0x77) this.castling &= ~1;
      if (from === 0x70 || to === 0x70) this.castling &= ~2;
      if (from === 0x07 || to === 0x07) this.castling &= ~4;
      if (from === 0x00 || to === 0x00) this.castling &= ~8;

      // Update EP square
      this.epSq = (flags & FLAG_PAWN_DBL) ? (from + (this.side === WHITE ? -16 : 16)) : -1;

      // Update hash for new castling, EP, side
      hi ^= Z_CASTLE_HI[this.castling];
      lo ^= Z_CASTLE_LO[this.castling];
      if (this.epSq !== -1) {
        const f = this.epSq & 7;
        hi ^= Z_EP_HI[f];
        lo ^= Z_EP_LO[f];
      }
      hi ^= Z_SIDE_HI;
      lo ^= Z_SIDE_LO;

      this.hashHi = hi >>> 0;
      this.hashLo = lo >>> 0;

      const us = this.side;
      this.side ^= 8;

      // Check legality: our king must not be left in check
      if (this.inCheck(us)) {
        this.unmakeMove();
        return false;
      }
      return true;
    }

    unmakeMove() {
      const u = this.undoStack.pop();
      const from = M_FROM(u.move);
      const to = M_TO(u.move);
      const promo = M_PROMO(u.move);
      const flags = M_FLAGS(u.move);
      const b = this.board;

      this.side ^= 8;
      const movedPiece = promo ? (this.side | 1) : b[to];

      b[from] = movedPiece;
      b[to] = u.captured;

      if (flags & FLAG_EP) {
        const epCapSq = to + (this.side === WHITE ? 16 : -16);
        b[epCapSq] = (this.side ^ 8) | 1;
      }

      if (flags & FLAG_CASTLE) {
        let rFrom, rTo;
        if (to === 0x76) { rFrom = 0x77; rTo = 0x75; }
        else if (to === 0x72) { rFrom = 0x70; rTo = 0x73; }
        else if (to === 0x06) { rFrom = 0x07; rTo = 0x05; }
        else { rFrom = 0x00; rTo = 0x03; }
        b[rFrom] = b[rTo];
        b[rTo] = EMPTY;
      }

      this.castling = u.castling;
      this.epSq = u.epSq;
      this.halfmove = u.halfmove;
      this.hashHi = u.hashHi;
      this.hashLo = u.hashLo;
      this.kingSq[0] = u.kingW;
      this.kingSq[1] = u.kingB;
    }

    makeNullMove() {
      this.undoStack.push({
        epSq: this.epSq,
        hashHi: this.hashHi,
        hashLo: this.hashLo
      });
      if (this.epSq !== -1) {
        const f = this.epSq & 7;
        this.hashHi = (this.hashHi ^ Z_EP_HI[f]) >>> 0;
        this.hashLo = (this.hashLo ^ Z_EP_LO[f]) >>> 0;
      }
      this.epSq = -1;
      this.side ^= 8;
      this.hashHi = (this.hashHi ^ Z_SIDE_HI) >>> 0;
      this.hashLo = (this.hashLo ^ Z_SIDE_LO) >>> 0;
    }

    unmakeNullMove() {
      const u = this.undoStack.pop();
      this.side ^= 8;
      this.epSq = u.epSq;
      this.hashHi = u.hashHi;
      this.hashLo = u.hashLo;
    }

    hasNonPawnMaterial(side) {
      const b = this.board;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[(r << 4) | c];
          if (p && (p & 8) === side) {
            const t = p & 7;
            if (t >= 2 && t <= 5) return true;
          }
        }
      }
      return false;
    }

    evaluate() {
      const b = this.board;
      let mgWhite = 0, mgBlack = 0;
      let egWhite = 0, egBlack = 0;
      let phase = 0;
      let wBishops = 0, bBishops = 0;
      const wPawnFiles = [0, 0, 0, 0, 0, 0, 0, 0];
      const bPawnFiles = [0, 0, 0, 0, 0, 0, 0, 0];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sq = (r << 4) | c;
          const p = b[sq];
          if (!p) continue;

          const type = p & 7;
          const isWhite = (p & 8) === 0;
          const pstIdx = isWhite ? ((r << 3) | c) : (((7 - r) << 3) | c);

          phase += PHASE_WEIGHTS[type];

          if (isWhite) {
            mgWhite += MG_VAL[type] + MG_PST[type][pstIdx];
            egWhite += EG_VAL[type] + EG_PST[type][pstIdx];
            if (type === 3) wBishops++;
            if (type === 1) wPawnFiles[c]++;
          } else {
            mgBlack += MG_VAL[type] + MG_PST[type][pstIdx];
            egBlack += EG_VAL[type] + EG_PST[type][pstIdx];
            if (type === 3) bBishops++;
            if (type === 1) bPawnFiles[c]++;
          }
        }
      }

      // Bishop pair bonus
      if (wBishops >= 2) { mgWhite += 30; egWhite += 45; }
      if (bBishops >= 2) { mgBlack += 30; egBlack += 45; }

      // Doubled pawns penalty
      for (let c = 0; c < 8; c++) {
        if (wPawnFiles[c] > 1) { mgWhite -= 12 * (wPawnFiles[c] - 1); egWhite -= 18 * (wPawnFiles[c] - 1); }
        if (bPawnFiles[c] > 1) { mgBlack -= 12 * (bPawnFiles[c] - 1); egBlack -= 18 * (bPawnFiles[c] - 1); }
      }

      const mgScore = mgWhite - mgBlack;
      const egScore = egWhite - egBlack;
      const clampedPhase = Math.min(24, phase);
      const score = Math.round((mgScore * clampedPhase + egScore * (24 - clampedPhase)) / 24);

      return this.side === WHITE ? score : -score;
    }
  }

  // Search state
  const MAX_PLY = 64;
  const killer1 = new Int32Array(MAX_PLY);
  const killer2 = new Int32Array(MAX_PLY);
  const historyTable = new Int32Array(16 * 128);

  let nodesSearched = 0;
  let searchDeadline = 0;
  let searchAborted = false;

  function scoreMoveForOrdering(board, move, ttBestMove, ply) {
    if (move === ttBestMove) return 2000000;
    const flags = M_FLAGS(move);
    const promo = M_PROMO(move);
    if (flags & FLAG_CAPTURE) {
      const to = M_TO(move);
      const from = M_FROM(move);
      const victim = (flags & FLAG_EP) ? 1 : (board.board[to] & 7);
      const attacker = board.board[from] & 7;
      return 1000000 + MG_VAL[victim] * 10 - MG_VAL[attacker];
    }
    if (promo) return 900000 + MG_VAL[promo];
    if (move === killer1[ply]) return 800000;
    if (move === killer2[ply]) return 700000;
    const piece = board.board[M_FROM(move)];
    return historyTable[(piece << 7) | M_TO(move)];
  }

  function pickNextMove(moves, scores, startIdx) {
    let bestIdx = startIdx;
    let bestScore = scores[startIdx];
    for (let i = startIdx + 1; i < moves.length; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestIdx = i;
      }
    }
    if (bestIdx !== startIdx) {
      const tm = moves[startIdx]; moves[startIdx] = moves[bestIdx]; moves[bestIdx] = tm;
      const ts = scores[startIdx]; scores[startIdx] = scores[bestIdx]; scores[bestIdx] = ts;
    }
  }

  function quiescence(board, alpha, beta, ply) {
    nodesSearched++;
    if ((nodesSearched & 2047) === 0 && performance.now() > searchDeadline) {
      searchAborted = true;
      return 0;
    }

    const standPat = board.evaluate();
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const moves = board.generateMoves(true);
    const scores = new Int32Array(moves.length);
    for (let i = 0; i < moves.length; i++) {
      scores[i] = scoreMoveForOrdering(board, moves[i], 0, ply);
    }

    for (let i = 0; i < moves.length; i++) {
      pickNextMove(moves, scores, i);
      const m = moves[i];
      if (!board.makeMove(m)) continue;
      const score = -quiescence(board, -beta, -alpha, ply + 1);
      board.unmakeMove();

      if (searchAborted) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function alphaBeta(board, depth, alpha, beta, ply, allowNull) {
    nodesSearched++;
    if ((nodesSearched & 2047) === 0 && performance.now() > searchDeadline) {
      searchAborted = true;
      return 0;
    }

    if (depth <= 0) {
      return quiescence(board, alpha, beta, ply);
    }

    const inCheck = board.inCheck();
    if (inCheck) depth++; // Check extension

    // TT Lookup
    const ttIdx = board.hashLo & TT_MASK;
    let ttBest = 0;
    if (ttKeyHi[ttIdx] === board.hashHi && ttKeyLo[ttIdx] === board.hashLo) {
      ttBest = ttMove[ttIdx];
      if (ttDepth[ttIdx] >= depth && ply > 0) {
        const flag = ttFlag[ttIdx];
        let s = ttScore[ttIdx];
        if (s > 19000) s -= ply;
        else if (s < -19000) s += ply;

        if (flag === TT_EXACT) return s;
        if (flag === TT_LOWER && s >= beta) return beta;
        if (flag === TT_UPPER && s <= alpha) return alpha;
      }
    }

    // Null-Move Pruning
    if (allowNull && !inCheck && depth >= 3 && ply > 0 && board.hasNonPawnMaterial(board.side)) {
      board.makeNullMove();
      const nullScore = -alphaBeta(board, depth - 3, -beta, -beta + 1, ply + 1, false);
      board.unmakeNullMove();
      if (searchAborted) return 0;
      if (nullScore >= beta) return beta;
    }

    const moves = board.generateMoves(false);
    const scores = new Int32Array(moves.length);
    for (let i = 0; i < moves.length; i++) {
      scores[i] = scoreMoveForOrdering(board, moves[i], ttBest, ply);
    }

    let legalCount = 0;
    let bestScore = -99999;
    let bestMove = 0;
    const origAlpha = alpha;

    for (let i = 0; i < moves.length; i++) {
      pickNextMove(moves, scores, i);
      const m = moves[i];
      if (!board.makeMove(m)) continue;
      legalCount++;

      let score;
      // Principal Variation Search (PVS) + Late Move Reduction (LMR)
      if (legalCount === 1) {
        score = -alphaBeta(board, depth - 1, -beta, -alpha, ply + 1, true);
      } else {
        const isQuiet = !(M_FLAGS(m) & FLAG_CAPTURE) && !M_PROMO(m);
        let reduction = 0;
        if (depth >= 3 && legalCount >= 4 && isQuiet && !inCheck) {
          reduction = 1;
        }
        score = -alphaBeta(board, depth - 1 - reduction, -alpha - 1, -alpha, ply + 1, true);
        if (score > alpha && (reduction > 0 || score < beta)) {
          score = -alphaBeta(board, depth - 1, -beta, -alpha, ply + 1, true);
        }
      }

      board.unmakeMove();
      if (searchAborted) return 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
        if (score > alpha) {
          alpha = score;
          if (alpha >= beta) {
            if (!(M_FLAGS(m) & FLAG_CAPTURE)) {
              killer2[ply] = killer1[ply];
              killer1[ply] = m;
              const p = board.board[M_FROM(m)];
              historyTable[(p << 7) | M_TO(m)] += depth * depth;
            }
            break;
          }
        }
      }
    }

    if (legalCount === 0) {
      return inCheck ? (-20000 + ply) : 0;
    }

    // Store in TT
    ttKeyHi[ttIdx] = board.hashHi;
    ttKeyLo[ttIdx] = board.hashLo;
    ttDepth[ttIdx] = depth;
    ttMove[ttIdx] = bestMove;
    let storeScore = bestScore;
    if (storeScore > 19000) storeScore += ply;
    else if (storeScore < -19000) storeScore -= ply;
    ttScore[ttIdx] = storeScore;

    if (bestScore <= origAlpha) ttFlag[ttIdx] = TT_UPPER;
    else if (bestScore >= beta) ttFlag[ttIdx] = TT_LOWER;
    else ttFlag[ttIdx] = TT_EXACT;

    return bestScore;
  }

  function findBestMove(fen, elo) {
    const board = new FastBoard(fen);
    const pseudo = board.generateMoves(false);
    const legalMoves = [];
    for (let i = 0; i < pseudo.length; i++) {
      if (board.makeMove(pseudo[i])) {
        legalMoves.push(pseudo[i]);
        board.unmakeMove();
      }
    }
    if (legalMoves.length === 0) return null;

    // 200 - 400 ELO (Martin-tier beginner): mostly random, takes captures occasionally
    if (elo <= 400) {
      const capChance = elo <= 250 ? 0.12 : 0.25;
      const captures = legalMoves.filter((m) => M_FLAGS(m) & FLAG_CAPTURE);
      if (captures.length > 0 && Math.random() < capChance) {
        return formatReturnMove(captures[Math.floor(Math.random() * captures.length)]);
      }
      return formatReturnMove(legalMoves[Math.floor(Math.random() * legalMoves.length)]);
    }

    // Opening book for ELO >= 1000
    if (elo >= 1000) {
      const fenParts = fen.trim().split(/\s+/);
      const bookKey = fenParts[0] + ' ' + fenParts[1];
      const bookMoves = OPENING_BOOK[bookKey];
      if (bookMoves && bookMoves.length > 0) {
        const pick = bookMoves[Math.floor(Math.random() * bookMoves.length)];
        return {
          from: pick.slice(0, 2),
          to: pick.slice(2, 4),
          promotion: pick[4] || 'q'
        };
      }
    }

    // Map Chess.com ELO (500..3200) -> maxDepth, timeBudgetMs, noiseCp
    let maxDepth = 2;
    let timeBudgetMs = 400;
    let noiseCp = 0;

    if (elo <= 600) {
      maxDepth = 1;
      timeBudgetMs = 200;
      noiseCp = 260;
    } else if (elo <= 800) {
      maxDepth = 2;
      timeBudgetMs = 250;
      noiseCp = 160;
    } else if (elo <= 1000) {
      maxDepth = 2;
      timeBudgetMs = 350;
      noiseCp = 90;
    } else if (elo <= 1200) {
      maxDepth = 3;
      timeBudgetMs = 450;
      noiseCp = 50;
    } else if (elo <= 1500) {
      maxDepth = 4;
      timeBudgetMs = 700;
      noiseCp = 22;
    } else if (elo <= 1800) {
      maxDepth = 5;
      timeBudgetMs = 1000;
      noiseCp = 8;
    } else if (elo <= 2100) {
      maxDepth = 6;
      timeBudgetMs = 1350;
      noiseCp = 0;
    } else if (elo <= 2500) {
      maxDepth = 7;
      timeBudgetMs = 1800;
      noiseCp = 0;
    } else if (elo <= 2800) {
      maxDepth = 8;
      timeBudgetMs = 2300;
      noiseCp = 0;
    } else {
      // 2900 - 3200 ELO: Maximum search
      maxDepth = 10;
      timeBudgetMs = 2800;
      noiseCp = 0;
    }

    killer1.fill(0);
    killer2.fill(0);
    historyTable.fill(0);
    nodesSearched = 0;
    searchDeadline = performance.now() + timeBudgetMs;
    searchAborted = false;

    let bestMoveOverall = legalMoves[0];
    let rootScoredMoves = [];

    for (let d = 1; d <= maxDepth; d++) {
      const iterMoves = [];
      let alpha = -99999;
      const beta = 99999;

      // Order root moves: previous iteration's best first
      const orderedRoot = legalMoves.slice();
      const scores = new Int32Array(orderedRoot.length);
      for (let i = 0; i < orderedRoot.length; i++) {
        scores[i] = scoreMoveForOrdering(board, orderedRoot[i], bestMoveOverall, 0);
      }

      for (let i = 0; i < orderedRoot.length; i++) {
        pickNextMove(orderedRoot, scores, i);
        const m = orderedRoot[i];
        board.makeMove(m);
        const score = -alphaBeta(board, d - 1, -beta, -alpha, 1, true);
        board.unmakeMove();

        if (searchAborted) break;

        iterMoves.push({ move: m, score });
        if (score > alpha) {
          alpha = score;
        }
      }

      if (searchAborted) break;

      iterMoves.sort((a, b) => b.score - a.score);
      if (iterMoves.length > 0) {
        bestMoveOverall = iterMoves[0].move;
        rootScoredMoves = iterMoves;
      }

      // Stop early if forced mate found
      if (iterMoves.length > 0 && iterMoves[0].score > 19000) {
        break;
      }
    }

    // Apply ELO-calibrated noise at lower/mid ratings
    if (noiseCp > 0 && rootScoredMoves.length > 1) {
      const noisy = rootScoredMoves.map((item) => ({
        move: item.move,
        score: item.score + (Math.random() * 2 - 1) * noiseCp
      }));
      noisy.sort((a, b) => b.score - a.score);
      return formatReturnMove(noisy[0].move);
    }

    return formatReturnMove(bestMoveOverall);
  }

  function formatReturnMove(m) {
    const promoMap = { 2: 'n', 3: 'b', 4: 'r', 5: 'q' };
    const p = M_PROMO(m);
    return {
      from: sqToAlgebraic(M_FROM(m)),
      to: sqToAlgebraic(M_TO(m)),
      promotion: p ? promoMap[p] : 'q'
    };
  }

  // ==========================================
  // Stockfish 19 WASM Web Worker Bridge
  // ==========================================
  const StockfishEngine = (() => {
    const WORKER_URL = 'vendor/stockfish/stockfish-19-lite-single.js';
    let worker = null;
    let initPromise = null;
    let ready = false;
    let failed = false;
    let uciEloMin = 1320;
    let uciEloMax = 3190;

    let currentLineHandler = null;
    let searchQueue = Promise.resolve();

    function send(cmd) {
      if (worker) worker.postMessage(cmd);
    }

    function ensureInitialized() {
      if (ready) return Promise.resolve(true);
      if (failed) return Promise.resolve(false);
      if (initPromise) return initPromise;

      if (typeof Worker === 'undefined' || (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:')) {
        failed = true;
        return Promise.resolve(false);
      }

      initPromise = new Promise((resolve) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            failed = true;
            resolve(false);
          }
        }, 12000);

        try {
          worker = new Worker(WORKER_URL);
        } catch (err) {
          clearTimeout(timeoutId);
          failed = true;
          settled = true;
          resolve(false);
          return;
        }

        let gotUciOk = false;

        worker.onerror = () => {
          if (!settled) {
            clearTimeout(timeoutId);
            failed = true;
            settled = true;
            resolve(false);
          }
        };

        worker.onmessage = (e) => {
          const line = typeof e.data === 'string' ? e.data.trim() : '';
          if (!line) return;

          if (!ready) {
            if (line.startsWith('option name UCI_Elo')) {
              const minM = line.match(/\bmin\s+(\d+)/);
              const maxM = line.match(/\bmax\s+(\d+)/);
              if (minM) uciEloMin = parseInt(minM[1], 10);
              if (maxM) uciEloMax = parseInt(maxM[1], 10);
            } else if (line === 'uciok' && !gotUciOk) {
              gotUciOk = true;
              send('isready');
            } else if (line === 'readyok' && gotUciOk) {
              ready = true;
              clearTimeout(timeoutId);
              if (!settled) {
                settled = true;
                resolve(true);
              }
            }
            return;
          }

          if (currentLineHandler) {
            currentLineHandler(line);
          }
        };

        send('uci');
      });

      return initPromise;
    }

    function parseUciMove(str) {
      if (!str || str === '(none)' || str.length < 4) return null;
      return {
        from: str.slice(0, 2),
        to: str.slice(2, 4),
        promotion: str[4] || 'q'
      };
    }

    function pickMultiPvMove(pvMap, elo) {
      const candidates = Object.values(pvMap);
      if (candidates.length === 0) return null;

      // Sort by best score first
      candidates.sort((a, b) => b.scoreCp - a.scoreCp);

      if (elo <= 350 && candidates.length > 1 && Math.random() < 0.28) {
        const randPick = candidates[Math.floor(Math.random() * candidates.length)];
        return parseUciMove(randPick.move);
      }

      let noiseCp = 25;
      if (elo <= 350) noiseCp = 360;
      else if (elo <= 550) noiseCp = 230;
      else if (elo <= 750) noiseCp = 145;
      else if (elo <= 950) noiseCp = 85;
      else if (elo <= 1150) noiseCp = 48;
      else noiseCp = 22;

      const noisy = candidates.map((c) => ({
        move: c.move,
        score: c.scoreCp + (Math.random() * 2 - 1) * noiseCp
      }));
      noisy.sort((a, b) => b.score - a.score);
      return parseUciMove(noisy[0].move);
    }

    function runSearch(fen, elo, timeBudgetCapMs) {
      return new Promise((resolve) => {
        const isLowElo = elo < uciEloMin;
        const pvMap = {};
        let phase = 'wait_ready';
        let resolved = false;

        const finish = (moveObj) => {
          if (resolved) return;
          resolved = true;
          currentLineHandler = null;
          resolve(moveObj);
        };

        const safetyTimer = setTimeout(() => {
          send('stop');
          if (isLowElo) {
            finish(pickMultiPvMove(pvMap, elo));
          } else {
            finish(null);
          }
        }, 5000);

        currentLineHandler = (line) => {
          if (phase === 'wait_ready') {
            if (line === 'readyok') {
              phase = 'searching';
              send(`position fen ${fen}`);
              if (isLowElo) {
                const cap = timeBudgetCapMs ? Math.min(350, timeBudgetCapMs) : 350;
                send(`go depth 5 movetime ${cap}`);
              } else {
                const t = Math.max(0, Math.min(1, (elo - uciEloMin) / Math.max(1, 3200 - uciEloMin)));
                const baseMoveTime = elo >= 3200 ? 1800 : Math.round(500 + t * 1050);
                const moveTime = timeBudgetCapMs ? Math.min(baseMoveTime, timeBudgetCapMs) : baseMoveTime;
                send(`go movetime ${Math.max(120, moveTime)}`);
              }
            }
            return;
          }

          if (phase === 'searching') {
            if (isLowElo && line.startsWith('info ') && line.includes(' pv ')) {
              const depthM = line.match(/\bdepth\s+(\d+)/);
              const mpvM = line.match(/\bmultipv\s+(\d+)/);
              const scoreM = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
              const pvM = line.match(/\bpv\s+([a-h][1-8][a-h][1-8][nbrq]?)/);
              if (scoreM && pvM) {
                const depth = depthM ? parseInt(depthM[1], 10) : 1;
                const mpv = mpvM ? parseInt(mpvM[1], 10) : 1;
                const val = parseInt(scoreM[2], 10);
                const scoreCp = scoreM[1] === 'mate'
                  ? (val > 0 ? 30000 - val * 100 : -30000 - val * 100)
                  : val;
                if (!pvMap[mpv] || depth >= pvMap[mpv].depth) {
                  pvMap[mpv] = { depth, scoreCp, move: pvM[1] };
                }
              }
            } else if (line.startsWith('bestmove ')) {
              clearTimeout(safetyTimer);
              const bestStr = line.split(/\s+/)[1];
              if (isLowElo && Object.keys(pvMap).length > 0) {
                finish(pickMultiPvMove(pvMap, elo));
              } else {
                finish(parseUciMove(bestStr));
              }
            }
          }
        };

        send('stop');
        if (isLowElo) {
          send('setoption name UCI_LimitStrength value false');
          send('setoption name Skill Level value 0');
          send('setoption name MultiPV value 12');
        } else if (elo >= 3200) {
          send('setoption name MultiPV value 1');
          send('setoption name UCI_LimitStrength value false');
          send('setoption name Skill Level value 20');
        } else {
          const clampedElo = Math.min(uciEloMax, Math.max(uciEloMin, elo));
          send('setoption name MultiPV value 1');
          send('setoption name UCI_LimitStrength value true');
          send(`setoption name UCI_Elo value ${clampedElo}`);
        }
        send('isready');
      });
    }

    function findBestMoveAsync(fen, elo, timeBudgetCapMs) {
      const task = searchQueue.then(async () => {
        const ok = await ensureInitialized();
        if (!ok) {
          return { move: findBestMove(fen, elo), engine: 'js' };
        }
        const sfMove = await runSearch(fen, elo, timeBudgetCapMs);
        if (!sfMove) {
          return { move: findBestMove(fen, elo), engine: 'js' };
        }
        return { move: sfMove, engine: 'stockfish' };
      });
      searchQueue = task.catch(() => {});
      return task;
    }

    function newGame() {
      if (ready) {
        send('stop');
        send('ucinewgame');
      } else {
        ensureInitialized();
      }
    }

    function stop() {
      if (ready) send('stop');
    }

    function isReady() {
      return ready;
    }

    return { ensureInitialized, findBestMoveAsync, newGame, stop, isReady };
  })();

  global.ChessBotEngine = { findBestMove };
  global.StockfishEngine = StockfishEngine;
})(window);
