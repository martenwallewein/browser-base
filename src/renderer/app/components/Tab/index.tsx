import { observer } from 'mobx-react';
import * as React from 'react';

import Preloader from '~/renderer/components/Preloader';
import Ripple from '~/renderer/components/Ripple';
import { Tab } from '~/renderer/app/models';
import store from '~/renderer/app/store';
import { closeWindow } from '~/renderer/app/utils';
import { TAB_ANIMATION_DURATION } from '~/renderer/app/constants';
import { colors } from '~/renderer/constants';
import { Circle, StyledTab, Content, Icon, Title, Close } from './style';

@observer
export default class extends React.Component<{ tab: Tab }, {}> {
  private ripple = React.createRef<Ripple>();

  public componentDidMount() {
    const { tab } = this.props;

    tab.setLeft(tab.getLeft(), false);
    tab.tabGroup.updateTabsBounds(true);
  }

  public onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const { pageX, pageY } = e;
    const { tab } = this.props;

    tab.select();

    store.tabsStore.lastMouseX = 0;
    store.tabsStore.isDragging = true;
    store.tabsStore.mouseStartX = pageX;
    store.tabsStore.tabStartX = tab.left;

    store.tabsStore.lastScrollLeft =
      store.tabsStore.containerRef.current.scrollLeft;

    this.ripple.current.makeRipple(pageX, pageY);
  };

  public onCloseMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  public onCloseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { tab } = this.props;
    const { tabGroup } = tab;
    const { tabs } = tabGroup;
    const selected = tabGroup.selectedTab === tab.id;

    e.stopPropagation();

    // TODO: remove page

    store.tabsStore.resetRearrangeTabsTimer();

    const notClosingTabs = tabs.filter(x => !x.isClosing);
    let index = notClosingTabs.indexOf(tab);

    tab.isClosing = true;
    if (notClosingTabs.length - 1 === index) {
      const previousTab = tabs[index - 1];
      tab.setLeft(previousTab.getNewLeft() + tab.getWidth(), true);
      tabGroup.updateTabsBounds(true);
    }

    tab.setWidth(0, true);
    tabGroup.setTabsLefts(true);

    if (selected) {
      index = tabs.indexOf(tab);

      if (index + 1 < tabs.length && !tabs[index + 1].isClosing) {
        const nextTab = tabs[index + 1];
        nextTab.select();
      } else if (index - 1 >= 0 && !tabs[index - 1].isClosing) {
        const prevTab = tabs[index - 1];
        prevTab.select();
      } else if (store.tabsStore.groups.length === 1) {
        closeWindow();
      }
    }

    setTimeout(() => {
      tabGroup.removeTab(tab.id);
    }, TAB_ANIMATION_DURATION * 1000);
  };

  public onClick = () => {};

  public onMouseOver = () => {
    this.props.tab.hovered = true;
  };

  public onMouseLeave = () => (this.props.tab.hovered = false);

  public render() {
    const { tab, children } = this.props;
    const { title, isClosing, hovered, favicon, loading, tabGroup } = tab;
    const { tabs } = tabGroup;

    const selected = tabGroup.selectedTab === tab.id;
    const tabIndex = tabs.indexOf(tab);

    let rightBorderVisible = true;

    if (
      hovered ||
      selected ||
      (tabIndex + 1 !== tabs.length &&
        (tabs[tabIndex + 1].hovered ||
          tabGroup.selectedTab === tabs[tabIndex + 1].id))
    ) {
      rightBorderVisible = false;
    }

    return (
      <StyledTab
        selected={selected}
        hovered={hovered}
        onMouseDown={this.onMouseDown}
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
        onClick={this.onClick}
        borderVisible={rightBorderVisible}
        isClosing={isClosing}
        ref={tab.ref}
      >
        <Content hovered={hovered} selected={selected}>
          {!loading && favicon !== '' && <Icon favicon={favicon.trim()} />}
          {loading && <Preloader thickness={6} size={16} />}
          <Title selected={selected} loading={loading} favicon={favicon}>
            {title}
          </Title>
        </Content>
        <Close
          onMouseDown={this.onCloseMouseDown}
          onClick={this.onCloseClick}
          hovered={hovered}
          selected={selected}
        >
          <Circle />
        </Close>
        {children}
        <Ripple
          rippleTime={0.6}
          ref={this.ripple}
          opacity={0.15}
          color={colors.blue['500']}
        />
      </StyledTab>
    );
  }
}
