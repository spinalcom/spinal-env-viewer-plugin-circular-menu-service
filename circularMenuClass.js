/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import circularMenuVue from "spinal-env-viewer-plugin-circular-menu/circularMenu.vue";
import Vue from "vue";
import { SpinalNode } from "spinal-env-viewer-graph-service";
const circularComponentCtor = Vue.extend(circularMenuVue);
const {
  spinalContextMenuService
} = require("spinal-env-viewer-context-menu-service");

const Autodesk = window.Autodesk;

var circularMenu = class circularMenu {
  constructor(viewer) {
    this.viewer = viewer;
    this.evt = {
      timeout: null,
      data: null,
      canvas: false,
      selected: false,
      xTouch: window.innerWidth / 2,
      yTouch: window.innerHeight / 2,
      x: 0,
      y: 0
    };


    const eventListener = () => {
      viewer.removeEventListener(window.Autodesk.Viewing.TOOLBAR_CREATED_EVENT, eventListener);

      viewer.clientContainer.addEventListener("click", evt => {
        this.close();
        if (evt.target instanceof HTMLCanvasElement) {
          this.onEvt(
            "canvas");
        }
      });
      const defaultSingleTapHandler = viewer.clickHandler
        .handleSingleTap;
      viewer.clickHandler.handleSingleTap = evt => {
        this.close();
        if (evt.target instanceof HTMLCanvasElement) {
          this.evt.xTouch = evt.center.x;
          this.evt.yTouch = evt.center.y;
          this.onEvt("canvas");
        }
        defaultSingleTapHandler(evt);
      };
      viewer.clientContainer.addEventListener("DynamicObjectClick",
        () => {
          this.close();
          try {
            this.evt.x = event.x;
            this.evt.y = event.y;
          } catch (e) {
            this.evt.x = this.evt.xTouch;
            this.evt.y = this.evt.yTouch;
          }
          this.evt.data = event;
          this.onEvt("dynamic");
        });
      viewer.addEventListener(Autodesk.Viewing.ESCAPE_EVENT, () => {
        this.close();
      });
      viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
        e => {
          try {
            this.evt.x = event.x;
            this.evt.y = event.y;
          } catch (e) {
            this.evt.x = this.evt.xTouch;
            this.evt.y = this.evt.yTouch;

          }
          this.evt.data = e.selections;
          this.close();
          this.onEvt("selected");
        });
    };
    viewer.addEventListener(window.Autodesk.Viewing.TOOLBAR_CREATED_EVENT, eventListener);

  }
  onEvt(evtFrom) {
    if (evtFrom === "canvas" || evtFrom === "selected" || evtFrom ==
      "dynamic") {
      this.evt[evtFrom] = true;
      if (this.evt.canvas === true && this.evt.selected === true) {
        this.onSelectionChange(this.evt.data);
        this.evt.canvas = false;
        this.evt.selected = false;
        if (this.evt.timeout !== null) clearInterval(this.evt.timeout);
        this.evt.timeout = null;
      } else if (this.evt.timeout == null) {
        this.evt.timeout = setTimeout(() => {
          this.evt.canvas = false;
          this.evt.selected = false;
          this.evt.timeout = null;
        }, 200);
      }
    }
  }
  async onSelectionChange(data) {
    if (data.length === 1 && data[0].dbIdArray.length === 1) {
      var x = this.evt.x;
      var y = this.evt.y;
      let dbId = data[0].dbIdArray[0];
      // il faut récupérer les BIMObject selected
      let bimObj = await window.spinal.BimObjectService.getBIMObject(data[0].dbIdArray[0], data[0].model);
      let myNode;
      if (bimObj instanceof SpinalNode) {
        window.spinal.spinalGraphService._addNode(bimObj);
        myNode = window.spinal.spinalGraphService.getNode(bimObj.info.id.get());
      } else {
        myNode = bimObj;
      }

      if (bimObj !== undefined && myNode !== undefined) {
        let objContextMenuService = {
          exist: true,
          selectedNode: myNode,
          dbid: dbId,
          model3d: data[0].model
        };
        return this.open(
          await this.getButtonList(objContextMenuService),
          x,
          y,
          objContextMenuService
        );
      }
      let objContextMenuService = {
        exist: false,
        dbid: dbId,
        model3d: data[0].model
      };

      let btnList = await this.getButtonList(objContextMenuService);
      this.open(btnList, x, y, objContextMenuService);
    } else if (data.is === "dynamic") {
      let objContextMenuService = {
        exist: true,
        selectedNode: data.returnObj.node,
        model3d: data.returnObj.model
      };
      let btnList = await this.getButtonList(objContextMenuService);
      this.open(btnList, data.x, data.y, objContextMenuService);
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
