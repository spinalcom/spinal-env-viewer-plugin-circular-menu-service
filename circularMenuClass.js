import bimobjService from 'spinal-env-viewer-plugin-bimobjectservice';
import circularMenuVue from 'spinal-env-viewer-plugin-circularmenugraph/circularMenu.vue'
import Vue from 'vue'
const circularComponentCtor = Vue.extend(circularMenuVue);
const {
  spinalContextMenuService,
  SpinalContextApp
} = require("spinal-env-viewer-context-menu-service");

var circularMenu = class circularMenu {
  constructor(viewer) {
    this.viewer = viewer;
    viewer.addEventListener(
      Autodesk.Viewing.SELECTION_CHANGED_EVENT,
      (e) => {
        this.onSelectionChange.call(this, e)
      }
    );
  }

  async onSelectionChange(data) {
    console.log('selection change');
    console.log(data);
    var x = event.clientX;
    var y = event.clientY;
    console.log(x, y)
    if (data.dbIdArray.length == 1) {
      let dbId = data.dbIdArray[0];
      let myNode = await bimobjService.getBIMObject(
        data.dbIdArray[0]
      );
      if (myNode != undefined) {
        let objContextMenuService = {
          exist: true,
          BIMObjectNode: myNode,
          dbId: dbId
        }
        this.open(await this.getButtonList(objContextMenuService), x, y);
      } else {
        let myNode = await bimobjService.createBIMObject(data.dbIdArray[0],
          this
          .viewer.model.getData()
          .instanceTree.getNodeName(data
            .dbIdArray[0])
        )
        let objContextMenuService = {
          exist: false,
          dbId: dbId
        }
        this.open(await this.getButtonList(objContextMenuService), x, y);
      }
    } else {
      this.close();
    }
  }
  getButtonList(objContextMenuService) {
    return spinalContextMenuService
      .getApps("circularMenu", objContextMenuService)
      .then((buttonList) => {
        return buttonList;
      });
  }
  mount() {
    console.log('mount');
    bimobjService.getGraph();
  }
  open(buttonList, x, y) {
    if (this.container != undefined) {
      this.close();
    }
    console.log(buttonList);
    this.container = document.createElement("div");
    document.body.append(this.container);
    let mySmallContainer = document.createElement("div")
    this.container.append(mySmallContainer);
    this.circularCtor = new circularComponentCtor({
      propsData: {
        buttonList: buttonList,
        x: x,
        y: y
      }
    }).$mount(mySmallContainer);
  }
  close() {
    this.container.remove();
  }
};
module.exports.circularMenu = circularMenu;