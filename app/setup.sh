#!/bin/bash
source activate hfgeo
export PYTHONPATH="$PWD:$PYTHONPATH"

#export DIR_IRI2016_REF_DAT="$PWD/Shared/IRI2016bc/data"
export DIR_MODELS_REF_DAT="$PWD/Shared/Pharlap_4.2.0/dat"
case $OSTYPE in
"linux-gnu")
    export LD_LIBRARY_PATH="$PWD/Shared/IonoPyIface/lib:$LD_LIBRARY_PATH"
;;
"darwin"*)
    export DYLD_LIBRARY_PATH="$PWD/Shared/IonoPyIface/lib:$DYLD_LIBRARY_PATH"
    # Necessray to avoid the error message about duplicates of OpenMP libraries.
    export KMP_DUPLICATE_LIB_OK=TRUE
esac
