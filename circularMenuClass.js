import bimobjService from "spinal-env-viewer-plugin-bimobjectservice";
import circularMenuVue from "spinal-env-viewer-plugin-circular-menu/circularMenu.vue";
import Vue from "vue";
const circularComponentCtor = Vue.extend(circularMenuVue);
const {
  spinalContextMenuService,
  SpinalContextApp
} = require("spinal-env-viewer-context-menu-service");

var circularMenu = class circularMenu {
  constructor(viewer) {
    this.viewer = viewer;
    this.evt = {
      timeout: null,
      data: null,
      canvas: false,
      selected: false,
      x: 0,
      y: 0
    };
    viewer.clientContainer.addEventListener("click", evt => {
      this.close();
      if (evt.target instanceof HTMLCanvasElement) this.onEvt("canvas");
    });
    viewer.addEventListener(Autodesk.Viewing.ESCAPE_EVENT, e => {
      this.close();
    });
    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, e => {
      this.evt.x = event.clientX;
      this.evt.y = event.clientY;
      this.evt.data = e;
      this.close();
      this.onEvt("selected");
      // this.onSelectionChange.call(this, e)
    });
  }

  onEvt(evtFrom) {
    if (evtFrom === "canvas" || evtFrom === "selected") {
      this.evt[evtFrom] = true;
      if (this.evt.canvas === true && this.evt.selected === true) {
        this.onSelectionChange(this.evt.data);
        this.evt.canvas = false;
        this.evt.selected = false;
        if (this.evt.timeout !== null) clearInterval(this.evt.timeout);
        this.evt.timeout = null;
      } else if (this.evt.timeout == null)
        this.evt.timeout = setTimeout(() => {
          this.evt.canvas = false;
          this.evt.selected = false;
          this.evt.timeout = null;
        }, 200);
    }
  }

  async onSelectionChange(data) {
    if (data.dbIdArray.length == 1) {
      var x = this.evt.x;
      var y = this.evt.y;

      let dbId = data.dbIdArray[0];
      let myNode = await bimobjService.getBIMObject(data.dbIdArray[0]);
      if (myNode != undefined) {
        let objContextMenuService = {
          exist: true,
          BIMObjectNode: myNode,
          dbId: dbId
        };
        this.open(
          await this.getButtonList(objContextMenuService),
          x,
          y,
          objContextMenuService
        );
      } else {
        // let myNode = await bimobjService.createBIMObject(data.dbIdArray[0],
        //   this
        //   .viewer.model.getData()
        //   .instanceTree.getNodeName(data
        //     .dbIdArray[0])
        // )
        let objContextMenuService = {
          exist: false,
          dbId: dbId
        };
        let btnList = await this.getButtonList(objContextMenuService);
        this.open(btnList, x, y, objContextMenuService);
      }
    } else {
      this.close();
    }
  }
  getButtonList(objContextMenuService) {
    return spinalContextMenuService
      .getApps("circularMenu", objContextMenuService)
      .then(buttonList => {
        return buttonList;
      });
  }
  mount() {
    bimobjService.getGraph();
  }
  open(buttonList, x, y, objContextMenuService) {
    if (this.close() == false) {
      this.container = document.createElement("div");
      document.body.append(this.container);
      let mySmallContainer = document.createElement("div");
      this.container.append(mySmallContainer);
      this.circularCtor = new circularComponentCtor({
        propsData: {
          buttonList: buttonList,
          x: x,
          y: y,
          options: objContextMenuService
        }
      }).$mount(mySmallContainer);
    }
  }
  close() {
    if (this.container != undefined) {
      this.container.remove();
      this.container = undefined;
      return true;
    }
    return false;
  }
};
module.exports.circularMenu = circularMenu;
