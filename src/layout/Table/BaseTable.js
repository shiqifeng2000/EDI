import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'mini-store';
import classNames from 'classnames';
import Big from 'big.js';
import _ from 'lodash';
import ColGroup from './ColGroup';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import ExpandableRow from './ExpandableRow';

class BaseTable extends React.Component {
  static propTypes = {
    fixed: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    columns: PropTypes.array.isRequired,
    tableClassName: PropTypes.string.isRequired,
    hasHead: PropTypes.bool.isRequired,
    hasBody: PropTypes.bool.isRequired,
    hasTotal: PropTypes.bool.isRequired,
    store: PropTypes.object.isRequired,
    expander: PropTypes.object.isRequired,
    getRowKey: PropTypes.func,
    isAnyColumnsFixed: PropTypes.bool,
  };

  static contextTypes = {
    table: PropTypes.any,
  };

  getColumns(cols) {
    const { columns = [], fixed } = this.props;
    const { table } = this.context;
    const { prefixCls } = table.props;
    return (cols || columns).map((column) => ({
      ...column,
      className:
        !!column.fixed && !fixed
          ? classNames(`${prefixCls}-fixed-columns-in-body`, column.className)
          : column.className,
    }));
  }

  handleRowHover = (isHover, key) => {
    this.props.store.setState({
      currentHoverKey: isHover ? key : null,
    });
  };

  renderRows = (renderData, indent, ancestorKeys = []) => {
    const { table } = this.context;
    const { columnManager, components } = table;
    const {
      prefixCls,
      childrenColumnName,
      rowClassName,
      rowRef,
      onRowClick,
      onRowDoubleClick,
      onRowContextMenu,
      onRowMouseEnter,
      onRowMouseLeave,
      onRow,
    } = table.props;
    const { getRowKey, fixed, expander, isAnyColumnsFixed } = this.props;

    const rows = [];

    for (let i = 0; i < renderData.length; i++) {
      const record = renderData[i];
      const key = getRowKey(record, i);
      const className =
        typeof rowClassName === 'string'
          ? rowClassName
          : rowClassName(record, i, indent);

      const onHoverProps = {};
      if (columnManager.isAnyColumnsFixed()) {
        onHoverProps.onHover = this.handleRowHover;
      }

      let leafColumns;
      if (fixed === 'left') {
        leafColumns = columnManager.leftLeafColumns();
      } else if (fixed === 'right') {
        leafColumns = columnManager.rightLeafColumns();
      } else {
        leafColumns = this.getColumns(columnManager.leafColumns());
      }

      const rowPrefixCls = `${prefixCls}-row`;

      const row = (
        <ExpandableRow
          {...expander.props}
          fixed={fixed}
          index={i}
          prefixCls={rowPrefixCls}
          record={record}
          key={key}
          rowKey={key}
          onRowClick={onRowClick}
          needIndentSpaced={expander.needIndentSpaced}
          onExpandedChange={expander.handleExpandChange}
        >
          {(
            expandableRow, // eslint-disable-line
          ) => (
            <TableRow
              fixed={fixed}
              indent={indent}
              className={className}
              record={record}
              index={i}
              prefixCls={rowPrefixCls}
              childrenColumnName={childrenColumnName}
              columns={leafColumns}
              onRow={onRow}
              onRowDoubleClick={onRowDoubleClick}
              onRowContextMenu={onRowContextMenu}
              onRowMouseEnter={onRowMouseEnter}
              onRowMouseLeave={onRowMouseLeave}
              {...onHoverProps}
              rowKey={key}
              ancestorKeys={ancestorKeys}
              ref={rowRef(record, i, indent)}
              components={components}
              isAnyColumnsFixed={isAnyColumnsFixed}
              {...expandableRow}
            />
          )}
        </ExpandableRow>
      );

      rows.push(row);

      expander.renderRows(
        this.renderRows,
        rows,
        record,
        i,
        indent,
        fixed,
        key,
        ancestorKeys,
      );
    }
    return rows;
  };

  renderTotalRows = (renderData, indent, ancestorKeys = []) => {
    const { table } = this.context;
    const { columnManager, components } = table;
    const { showTotalRow } = table.props;
    const {
      prefixCls,
      childrenColumnName,
      rowClassName,
      rowRef,
      onRowClick,
      onRowDoubleClick,
      onRowContextMenu,
      onRowMouseEnter,
      onRowMouseLeave,
      onRow,
    } = table.props;
    const { getRowKey, fixed, expander, isAnyColumnsFixed } = this.props;

    const rows = [];

    if (showTotalRow) {
      const key = '__totalRow__';
      const className = '__totalRow__';

      const onHoverProps = {};
      if (columnManager.isAnyColumnsFixed()) {
        onHoverProps.onHover = this.handleRowHover;
      }

      let leafColumns;
      if (fixed === 'left') {
        leafColumns = columnManager.leftLeafColumns();
      } else if (fixed === 'right') {
        leafColumns = columnManager.rightLeafColumns();
      } else {
        leafColumns = this.getColumns(columnManager.leafColumns());
      }

      const rowPrefixCls = `${prefixCls}-row`;
      const record = {};
      leafColumns.forEach((column) => {
        let sum = 0;
        if (column.countable === true) {
          renderData.forEach((item) => {
              try {
                sum = Big(sum).plus(item[column.dataIndex] || 0).valueOf()
              } catch (error) {
                sum = 0
              }
            }
          );
          record[column.dataIndex] = sum;
          record[column.key] = sum;
        } else if (typeof column.countable === 'string') {
          record[column.dataIndex] = column.countable;
        } else {
          record[column.dataIndex] = '';
        }
      });
      const row = (
        <TableRow
          key={key}
          fixed={fixed}
          indent={indent}
          className={className}
          record={record}
          prefixCls={rowPrefixCls}
          childrenColumnName={childrenColumnName}
          columns={leafColumns}
          onRow={onRow}
          onRowDoubleClick={onRowDoubleClick}
          onRowContextMenu={onRowContextMenu}
          onRowMouseEnter={onRowMouseEnter}
          onRowMouseLeave={onRowMouseLeave}
          {...onHoverProps}
          rowKey={key}
          ancestorKeys={ancestorKeys}
          components={components}
          isAnyColumnsFixed={isAnyColumnsFixed}
        />
      );
      rows.push(row);
    }
    return rows;
  };

  render() {
    const { table } = this.context;
    const { components } = table;
    const { prefixCls, scroll, data, getBodyWrapper } = table.props;
    const { expander, tableClassName, hasHead, hasBody, hasTotal, fixed } = this.props;
    const tableStyle = {};

    if (!fixed && scroll.x) {
      // not set width, then use content fixed width
      if (scroll.x === true) {
        tableStyle.tableLayout = 'fixed';
      } else {
        tableStyle.maxWidth = scroll.x;
      }
    }

    const Table = hasBody ? components.table : 'table';
    const BodyWrapper = components.body.wrapper;

    let body;
    if (hasBody) {
      body = (
        <BodyWrapper className={`${prefixCls}-tbody`}>
          {this.renderRows(data, 0)}
        </BodyWrapper>
      );
      if (getBodyWrapper) {
        body = getBodyWrapper(body);
      }
    }
    let total;
    if (hasTotal) {
      total = (
        <BodyWrapper className={`${prefixCls}-thead`}>
          {this.renderTotalRows(data, 0)}
        </BodyWrapper>
      );
      if (getBodyWrapper) {
        body = getBodyWrapper(body);
      }
    }

    const columns = this.getColumns();

    return (
      <Table className={tableClassName} style={tableStyle} key="table">
        <ColGroup columns={columns} fixed={fixed} />
        {hasHead && (
          <TableHeader expander={expander} columns={columns} fixed={fixed} />
        )}
        {body}
        {total}
      </Table>
    );
  }
}

export default connect()(BaseTable);
