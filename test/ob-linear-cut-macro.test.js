const setValueMock = jest.fn(gCode => { })
const myFake = {
  editor: {
    session: {
      setValue: setValueMock
    },
    getValue: () => { }
  },
  Metro: {
    dialog: {
      create: () => { }
    }
  },
  parseGcodeInWebWorker: () => { }
}
const parseGcodeInWebWorker = jest.fn()
global.Metro = myFake.Metro
global.editor = myFake.editor
global.parseGcodeInWebWorker = parseGcodeInWebWorker

const generateGCode = require('../src/ob-linear-cut-macro');

function splitAndTrimGCode(gCode) {
  return gCode.split("\n")
    .map(l => l.replaceAll(/\s*;.*$/gm, ""))
    .filter(l => l.length > 0)
    .filter(l => !['G21', 'G54', 'G90', 'M3 S1000', 'M5 S0'].includes(l))
}

beforeEach(() => {
  setValueMock.mockClear();
  parseGcodeInWebWorker.mockClear();
});

//generateGCode(xMovement, yMovement, zMovement, stepDown, feedrate)
describe("linear cut macro", () => {

  // test if it handles invalid settings
  describe("should do nothing", () => {
    test("if there is no depth defined", () => {
      generateGCode(100, 0, 0, 1, 100);
      expect(setValueMock).not.toHaveBeenCalled();
      expect(parseGcodeInWebWorker).not.toHaveBeenCalled();
    });
    test("ff depth is negative", () => {
      generateGCode(100, 0, -10, 1, 100);
      expect(setValueMock).not.toHaveBeenCalled();
      expect(parseGcodeInWebWorker).not.toHaveBeenCalled();
    });
    test("ff step-down is 0", () => {
      generateGCode(100, 0, 10, 0, 100);
      expect(setValueMock).not.toHaveBeenCalled();
      expect(parseGcodeInWebWorker).not.toHaveBeenCalled();
    });
    test("ff step-down is negative", () => {
      generateGCode(100, 0, 10, -1, 100);
      expect(setValueMock).not.toHaveBeenCalled();
      expect(parseGcodeInWebWorker).not.toHaveBeenCalled();
    });
  });

  // test if it updates the editor and 3D view
  describe("for valid settings, it", () => {
    it("should update the gCode editor", () => {
      generateGCode(100, 0, 10, 1, 100);
      expect(setValueMock).toHaveBeenCalled();
    });
    it("should trigger to parse it", () => {
      generateGCode(100, 0, 10, 1, 100);
      expect(parseGcodeInWebWorker).toHaveBeenCalled();
    });
  });

  // test for one line path
  describe("for a 1mm deep cut with 1mm steps, it", () => {
    const gCode = splitAndTrimGCode(generateGCode(100, 10, 1, 1, 100));
    var i = 0
    it("should move to a save height", () => {
      expect(gCode[i++]).toMatch("G0 Z7")
    });
    it("should move to x0/y0", () => {
      expect(gCode[i++]).toMatch(/G0 F\d* X0 Y0/)
    });
    it("should mill down one step", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* Z-1/)
    });
    it("should mill horizontal to x/y", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* X100 Y10/)
    });
    it("should go back to a save height", () => {
      expect(gCode[i++]).toMatch("G0 Z7")
    });
  })

  // test three line paths with step down at each end
  describe("for a 3mm deep cut with 1mm steps, it", () => {
    const gCode = splitAndTrimGCode(generateGCode(100, 10, 3, 1, 100));
    var i = 0
    it("should move to a save height", () => {
      expect(gCode[i++]).toMatch("G0 Z7")
    });
    it("should move to x0/y0", () => {
      expect(gCode[i++]).toMatch(/G0 F\d* X0 Y0/)
    });
    it("should mill down one step to -1", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* Z-1/)
    });
    it("should mill horizontal to x/y", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* X100 Y10/)
    });
    it("should mill down the next step to -2", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* Z-2/)
    });
    it("should mill horizontal back to 0/0", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* X0 Y0/)
    });
    it("should mill down the next step to -3", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* Z-3/)
    });
    it("should mill horizontal to x/y", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* X100 Y10/)
    });
    it("should go back to a save height", () => {
      expect(gCode[i++]).toMatch("G0 Z7")
    });
  })

  // test handling of shortened final step-down
  describe("for a 3mm deep cut with 2mm steps, it", () => {
    const gCode = splitAndTrimGCode(generateGCode(100, 10, 3, 2, 100));
    var i = 0
    it("should move to a save height", () => {
      expect(gCode[i++]).toMatch("G0 Z7")
    });
    it("should move to x0/y0", () => {
      expect(gCode[i++]).toMatch(/G0 F\d* X0 Y0/)
    });
    it("should mill down one step to -1", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* Z-2/)
    });
    it("should mill horizontal to x/y", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* X100 Y10/)
    });
    it("should mill down the next step, shortened to -3", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* Z-3/)
    });
    it("should mill horizontal back to 0/0", () => {
      expect(gCode[i++]).toMatch(/G1 F\d* X0 Y0/)
    });
    it("should go back to a save height", () => {
      expect(gCode[i++]).toMatch("G0 Z7")
    });
  })

});
