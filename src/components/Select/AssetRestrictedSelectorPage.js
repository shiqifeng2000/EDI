import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import Select from './index'
import Selectors from "../../redux/selectors"

class AssetSelectorPage extends Component {
  constructor(props){
    super(props)
    this.resetState = this.resetState.bind(this)
  }
  resetState(){
    this.select.resetState()
  }
  render() {
    let disabled = (this.props.userType === 1), noEmpty = disabled, props = {disabled, noEmpty,...this.props};
    return (<Select {...props} ref={(select)=>{this.select = select}}/>)
  }
}

AssetSelectorPage.propTypes = {
  options: PropTypes.array,
}


const mapStateToProps = (state, ownProps) => ({
  options: ownProps.options || Selectors.getRelatedFundOrgs(state),
  userType: Selectors.getUserType(state),
})

export default connect(mapStateToProps,null,null,{withRef: true})(AssetSelectorPage)
