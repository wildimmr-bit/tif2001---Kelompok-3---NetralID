const { toBase, pricePerBase, recipeCost } = require('../src/utils/units')

describe('toBase', () => {
  it('mengubah kg ke gram', () => {
    expect(toBase(2, 'kg')).toBe(2000)
  })

  it('mengubah ons ke gram', () => {
    expect(toBase(3, 'ons')).toBe(300)
  })

  it('mengubah liter ke ml', () => {
    expect(toBase(2, 'liter')).toBe(2000)
  })

  it('gram, ml, dan butir tidak berubah', () => {
    expect(toBase(250, 'gram')).toBe(250)
    expect(toBase(500, 'ml')).toBe(500)
    expect(toBase(10, 'butir')).toBe(10)
  })

  it('menolak satuan yang tidak dikenal', () => {
    expect(() => toBase(1, 'sendok')).toThrow('Satuan tidak dikenal')
  })

  it('menolak jumlah nol, negatif, atau bukan angka', () => {
    expect(() => toBase(0, 'kg')).toThrow()
    expect(() => toBase(-1, 'kg')).toThrow()
    expect(() => toBase('2', 'kg')).toThrow()
  })
})

describe('pricePerBase', () => {
  it('tepung 1 kg Rp12.000 menjadi Rp12 per gram', () => {
    expect(pricePerBase(12000, 1, 'kg')).toBe(12)
  })

  it('minyak goreng 2 liter Rp36.000 menjadi Rp18 per ml', () => {
    expect(pricePerBase(36000, 2, 'liter')).toBe(18)
  })

  it('telur 10 butir Rp28.000 menjadi Rp2.800 per butir', () => {
    expect(pricePerBase(28000, 10, 'butir')).toBe(2800)
  })

  it('gula 1 ons Rp1.500 menjadi Rp15 per gram', () => {
    expect(pricePerBase(1500, 1, 'ons')).toBe(15)
  })

  it('menerima harga 0', () => {
    expect(pricePerBase(0, 1, 'kg')).toBe(0)
  })

  it('menolak harga negatif', () => {
    expect(() => pricePerBase(-1, 1, 'kg')).toThrow('Harga tidak boleh negatif')
  })
})

describe('recipeCost', () => {
  const tepung = { unit: 'kg', pricePerBase: 12 }
  const telur = { unit: 'butir', pricePerBase: 2800 }

  it('200 gram tepung berbiaya Rp2.400', () => {
    expect(recipeCost(tepung, 200, 'gram')).toBe(2400)
  })

  it('takaran boleh memakai satuan lain yang sejenis (0,5 kg = 500 gram)', () => {
    expect(recipeCost(tepung, 0.5, 'kg')).toBe(6000)
  })

  it('3 butir telur berbiaya Rp8.400', () => {
    expect(recipeCost(telur, 3, 'butir')).toBe(8400)
  })

  it('menolak takaran gram untuk bahan yang dihitung per butir', () => {
    expect(() => recipeCost(telur, 100, 'gram')).toThrow('Satuan takaran tidak sejenis dengan bahan')
  })

  it('menolak takaran ml untuk bahan berat', () => {
    expect(() => recipeCost(tepung, 100, 'ml')).toThrow('Satuan takaran tidak sejenis dengan bahan')
  })
})